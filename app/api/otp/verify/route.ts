/**
 * POST /api/otp/verify
 * 
 * Verify OTP code submitted by user
 * Enforces: 3 max attempts, 5-minute expiration, rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyOTP } from '@/lib/sms';
import { logSuspiciousEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // 1. Parse request body
    const body = await request.json();
    const { verificationId, otp } = body;

    if (!verificationId || !otp) {
      return NextResponse.json(
        { error: 'Missing verificationId or otp' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // 2. Initialize Supabase client
    const supabase = createClient();

    // 3. Fetch verification record
    const { data: verification, error: fetchError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verification record not found' },
        { status: 404 }
      );
    }

    // 4. Check if already verified
    if (verification.status === 'verified') {
      return NextResponse.json(
        { success: true, alreadyVerified: true, message: 'Phone already verified' },
        { status: 200 }
      );
    }

    // 5. Check if expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    if (now > expiresAt) {
      await supabase
        .from('phone_verifications')
        .update({ status: 'expired' })
        .eq('id', verificationId);

      return NextResponse.json(
        { error: 'OTP expired', expired: true },
        { status: 410 }
      );
    }

    // 6. Check if max attempts reached
    if (verification.attempts >= verification.max_attempts) {
      await supabase
        .from('phone_verifications')
        .update({ status: 'failed' })
        .eq('id', verificationId);

      await logSuspiciousEvent({
        event_type: 'otp_max_attempts',
        severity: 'high',
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          verificationId,
          leadId: verification.lead_id,
          attempts: verification.attempts,
        },
      });

      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded', locked: true },
        { status: 429 }
      );
    }

    // 7. Verify OTP
    const isValid = await verifyOTP(otp, verification.otp_hash);

    if (!isValid) {
      // Increment attempts
      const newAttempts = verification.attempts + 1;
      await supabase
        .from('phone_verifications')
        .update({ attempts: newAttempts })
        .eq('id', verificationId);

      // Check if this was the last attempt
      const remainingAttempts = verification.max_attempts - newAttempts;
      if (remainingAttempts === 0) {
        await supabase
          .from('phone_verifications')
          .update({ status: 'failed' })
          .eq('id', verificationId);

        await logSuspiciousEvent({
          event_type: 'otp_max_attempts',
          severity: 'high',
          ip_address: ip,
          user_agent: userAgent,
          metadata: {
            verificationId,
            leadId: verification.lead_id,
            attempts: newAttempts,
          },
        });

        return NextResponse.json(
          { error: 'Invalid code. Maximum attempts exceeded.', locked: true, remainingAttempts: 0 },
          { status: 429 }
        );
      }

      // Log failed attempt
      await logSuspiciousEvent({
        event_type: 'otp_invalid_attempt',
        severity: 'low',
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          verificationId,
          leadId: verification.lead_id,
          attempts: newAttempts,
        },
      });

      return NextResponse.json(
        { error: 'Invalid verification code', remainingAttempts },
        { status: 401 }
      );
    }

    // 8. OTP is valid - mark as verified
    const verifiedAt = new Date();
    await supabase
      .from('phone_verifications')
      .update({
        status: 'verified',
        verified_at: verifiedAt.toISOString(),
      })
      .eq('id', verificationId);

    // 9. Update lead record with phone_verified_at
    await supabase
      .from('leads')
      .update({ phone_verified_at: verifiedAt.toISOString() })
      .eq('id', verification.lead_id);

    // 10. Log success
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      event: 'OTP_VERIFIED',
      verificationId,
      leadId: verification.lead_id,
      attempts: verification.attempts + 1, // Include the successful attempt
      ip,
      duration_ms: duration,
    }));

    return NextResponse.json({
      success: true,
      verified: true,
      leadId: verification.lead_id,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(JSON.stringify({
      event: 'OTP_VERIFY_ERROR',
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
