/**
 * POST /api/otp/send
 * 
 * Send OTP to lead's phone number
 * Rate limits: 2 requests per minute per IP, 3 resends per 15 minutes per phone
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import {
  generateOTP,
  hashOTP,
  hashPhoneNumber,
  getOTPExpiry,
  sendOtp,
  buildOTPMessage,
  isValidPhoneNumber,
  formatPhoneForDisplay,
} from '@/lib/sms';
import { logSuspiciousEvent } from '@/lib/security';

// Rate limit stores (in-memory for simplicity - use Redis in production)
const ipRateLimitStore = new Map<string, { count: number; resetAt: number }>();
const phoneRateLimitStore = new Map<string, { count: number; resetAt: number }>();

const IP_RATE_LIMIT = 2; // requests per minute
const PHONE_RATE_LIMIT = 3; // requests per 15 minutes
const IP_WINDOW_MS = 60 * 1000; // 1 minute
const PHONE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    // New window or expired
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    return { allowed: false, resetIn: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // 1. Parse request body
    const body = await request.json();
    const { leadId, phoneNumber } = body;

    if (!leadId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing leadId or phoneNumber' },
        { status: 400 }
      );
    }

    // 2. Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +14155552671)' },
        { status: 400 }
      );
    }

    // 3. Rate limit by IP
    const ipCheck = checkRateLimit(ipRateLimitStore, ip, IP_RATE_LIMIT, IP_WINDOW_MS);
    if (!ipCheck.allowed) {
      await logSuspiciousEvent({
        event_type: 'otp_rate_limit_ip',
        severity: 'medium',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { leadId, resetIn: ipCheck.resetIn },
      });

      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting another code.', resetIn: ipCheck.resetIn },
        { status: 429 }
      );
    }

    // 4. Rate limit by phone number
    const phoneHash = hashPhoneNumber(phoneNumber);
    const phoneCheck = checkRateLimit(phoneRateLimitStore, phoneHash, PHONE_RATE_LIMIT, PHONE_WINDOW_MS);
    if (!phoneCheck.allowed) {
      await logSuspiciousEvent({
        event_type: 'otp_rate_limit_phone',
        severity: 'medium',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { leadId, phoneHash, resetIn: phoneCheck.resetIn },
      });

      return NextResponse.json(
        { error: 'Too many verification attempts for this phone number. Please try again later.', resetIn: phoneCheck.resetIn },
        { status: 429 }
      );
    }

    // 5. Initialize Supabase client
    const supabase = createClient();

    // 6. Verify lead exists and matches phone number
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, phone_e164, phone_verified_at')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Normalize phone numbers for comparison
    const normalizedLeadPhone = lead.phone_e164.replace(/\D/g, '');
    const normalizedRequestPhone = phoneNumber.replace(/\D/g, '');

    if (normalizedLeadPhone !== normalizedRequestPhone) {
      await logSuspiciousEvent({
        event_type: 'otp_phone_mismatch',
        severity: 'high',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { leadId, providedPhone: phoneHash },
      });

      return NextResponse.json(
        { error: 'Phone number does not match lead record' },
        { status: 403 }
      );
    }

    // Check if already verified
    if (lead.phone_verified_at) {
      return NextResponse.json(
        { success: true, alreadyVerified: true, message: 'Phone number already verified' },
        { status: 200 }
      );
    }

    // 7. Delete old pending OTPs for this phone (prevents duplicate key constraint)
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('phone_hash', phoneHash)
      .in('status', ['pending', 'expired', 'failed']);

    // 8. Generate OTP and hash
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // 9. Insert verification record
    const { data: verification, error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        lead_id: leadId,
        phone_number: phoneNumber,
        phone_hash: phoneHash,
        otp_hash: otpHash,
        status: 'pending',
        attempts: 0,
        expires_at: expiresAt.toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[OTP Send Error]', insertError);
      return NextResponse.json(
        { error: 'Failed to create verification record' },
        { status: 500 }
      );
    }

    // 10. Send SMS via provider-agnostic interface
    const message = buildOTPMessage(otp);
    const smsResult = await sendOtp({ phone: phoneNumber, message });

    if (!smsResult.success) {
      // Mark verification as failed
      await supabase
        .from('phone_verifications')
        .update({ status: 'failed' })
        .eq('id', verification.id);

      // Map error codes to user-friendly messages
      let errorMessage = 'Failed to send SMS. Please try again.';
      
      if (smsResult.errorCode === 'invalid_phone') {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (smsResult.errorCode === 'throttled') {
        errorMessage = 'SMS service is temporarily unavailable. Please try again in a few minutes.';
      } else if (smsResult.errorCode === 'not_configured') {
        errorMessage = 'SMS service not configured. Please contact support.';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // 11. Log success
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      event: 'OTP_SENT',
      leadId,
      verificationId: verification.id,
      phoneDisplay: `***${formatPhoneForDisplay(phoneNumber)}`,
      provider: smsResult.provider,
      messageId: smsResult.messageId,
      ip,
      duration_ms: duration,
    }));

    return NextResponse.json({
      success: true,
      verificationId: verification.id,
      expiresIn: 300, // 5 minutes in seconds
      phoneDisplay: `***${formatPhoneForDisplay(phoneNumber)}`,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(JSON.stringify({
      event: 'OTP_SEND_ERROR',
      error: error.message,
      ip,
      duration_ms: duration,
    }));

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
