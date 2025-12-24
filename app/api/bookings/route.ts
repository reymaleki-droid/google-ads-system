import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent } from '@/lib/google';
import { formatInTimeZone } from 'date-fns-tz';
import { sendConfirmationEmail } from '@/lib/email';
import { validateEnvironment } from '@/lib/env-check';
import { rateLimit, validateSlotDate } from '@/lib/rate-limit';
import { extractAttributionData, saveAttributionEvent, enqueueConversionEvent, generateSessionId } from '@/lib/attribution';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting: 5 requests per minute
const bookingRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });

// Validate environment variables on module load
if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}

/**
 * TIMEZONE TEST SCENARIO:
 * 
 * If user selects "1:00 PM Dubai time" slot:
 * 1. Client sends: booking_start_utc = "2025-12-23T09:00:00.000Z" (1:00 PM Dubai = 9:00 AM UTC)
 * 2. Server stores: selected_start = "2025-12-23T09:00:00.000Z", booking_timezone = "Asia/Dubai"
 * 3. Server computes display: formatInTimeZone(booking_start_utc, "Asia/Dubai", ...) = "1:00 PM"
 * 4. Email MUST show: "Monday, December 23, 2025 at 1:00 PM (Dubai time)"
 * 5. Logs MUST show: "Re-computed from stored UTC+TZ: 1:00 PM"
 * 
 * PROOF: If email shows 5:00 PM instead of 1:00 PM, the bug still exists.
 * The ONLY source of truth is: booking_start_utc + booking_timezone.
 */

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  console.log('BOOKING_CREATE_START', { requestId, timestamp: new Date().toISOString() });
  
  // Apply rate limiting
  const rateLimitResponse = bookingRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { 
      lead_id, 
      booking_start_utc, 
      booking_end_utc, 
      booking_timezone = 'Asia/Dubai',
      selected_display_label,
      idempotency_key,
      session_id
    } = body;

    console.log('[Booking] ===== BOOKING REQUEST RECEIVED =====');
    console.log('[Booking] Request ID:', requestId);
    console.log('[Booking] Lead ID:', lead_id);
    console.log('[Booking] Start UTC:', booking_start_utc);
    console.log('[Booking] End UTC:', booking_end_utc);
    console.log('[Booking] Timezone:', booking_timezone);
    console.log('[Booking] Selected Display Label:', selected_display_label);
    console.log('[Booking] Idempotency Key:', idempotency_key || 'none');
    console.log('[Booking] Session ID:', session_id || 'none');
    console.log('[Booking] ==========================================');

    // Validate input
    if (!lead_id || !booking_start_utc || !booking_end_utc) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: lead_id, booking_start_utc, booking_end_utc' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const dateValidation = validateSlotDate(booking_start_utc);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { ok: false, error: dateValidation.error || 'Invalid booking date' },
        { status: 400 }
      );
    }

    // RULE 4: Hard validation - compute display time from UTC + timezone
    const computedDisplayTime = formatInTimeZone(
      new Date(booking_start_utc), 
      booking_timezone, 
      'h:mm a'
    );
    
    console.log('[Booking] ===== TIMEZONE VALIDATION =====');
    console.log('[Booking] UTC Timestamp:', booking_start_utc);
    console.log('[Booking] Timezone:', booking_timezone);
    console.log('[Booking] Computed Display Time:', computedDisplayTime);
    if (selected_display_label) {
      console.log('[Booking] Client Display Label:', selected_display_label);
      // Check if computed time is in the label (for validation)
      if (!selected_display_label.includes(computedDisplayTime)) {
        console.warn('[Booking] ⚠️  WARNING: Display label mismatch!');
        console.warn('[Booking] Expected time:', computedDisplayTime);
        console.warn('[Booking] Label sent:', selected_display_label);
      } else {
        console.log('[Booking] ✓ Display time matches label');
      }
    }
    console.log('[Booking] =====================================');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Booking] Missing Supabase environment variables');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check idempotency - prevent duplicate bookings
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('idempotency_key', idempotency_key)
        .single();
      
      if (existing) {
        console.log('[Booking] Idempotent request - returning existing booking:', existing.id);
        return NextResponse.json({ ok: true, booking_id: existing.id, idempotent: true });
      }
    }

    // Verify the slot is still available (using UTC timestamps)
    const isAvailable = await checkSlotAvailability(booking_start_utc, booking_end_utc, supabase);
    if (!isAvailable) {
      console.log('[Booking] ERROR: Slot unavailable - conflict detected');
      return NextResponse.json(
        { ok: false, error: 'This time slot is no longer available. Please select another.' },
        { status: 409 }
      );
    }

    // Fetch lead data using service_role (anon SELECT blocked)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: lead, error: leadError } = await serviceSupabase
      .from('leads')
      .select('full_name, email, phone_verified_at')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      console.error('[Booking] Error fetching lead:', leadError);
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Enforce phone verification (Phase 2 feature flag)
    const enforcePhoneVerification = process.env.ENFORCE_PHONE_VERIFICATION?.trim() === 'false';
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('[PHONE VERIFICATION CHECK]');
    console.log('  ENFORCE_PHONE_VERIFICATION:', process.env.ENFORCE_PHONE_VERIFICATION);
    console.log('  enforcePhoneVerification:', enforcePhoneVerification);
    console.log('  lead.phone_verified_at:', lead.phone_verified_at);
    console.log('  Will block?', enforcePhoneVerification && !lead.phone_verified_at);
    console.log('═══════════════════════════════════════════════════════');
    
    if (enforcePhoneVerification && !lead.phone_verified_at) {
      console.log('[Booking] ⛔ RETURNING 403 - Phone verification required');
      return NextResponse.json(
        { ok: false, error: 'Phone verification required', requiresVerification: true },
        { status: 403 }
      );
    }
    
    // Log verification status (Phase 1 logging)
    if (lead.phone_verified_at) {
      console.log('[Booking] Phone verified at:', lead.phone_verified_at);
    } else {
      console.log('[Booking] Phone NOT verified - allowing booking (enforcement disabled)');
    }

    // RULE 2: Generate email display time from ONLY booking_start_utc + booking_timezone
    const emailDisplayTime = formatInTimeZone(
      new Date(booking_start_utc), 
      booking_timezone, 
      'EEEE, MMMM d, yyyy \'at\' h:mm a'
    );
    
    const emailDisplayEndTime = formatInTimeZone(
      new Date(booking_end_utc), 
      booking_timezone, 
      'h:mm a'
    );
    
    console.log('[Booking] ===== EMAIL DISPLAY TIME =====');
    console.log('[Booking] Email will show:', emailDisplayTime);
    console.log('[Booking] End time:', emailDisplayEndTime);
    console.log('[Booking] Timezone:', booking_timezone, '(GMT+4)');
    console.log('[Booking] =====================================');

    // Create booking - SINGLE SOURCE OF TRUTH
    const bookingData = {
      lead_id,
      selected_start: booking_start_utc, // UTC ISO timestamp
      selected_end: booking_end_utc, // UTC ISO timestamp
      booking_timezone: booking_timezone, // IANA timezone
      local_start_display: emailDisplayTime, // RULE 2: Computed from UTC + timezone
      status: 'confirmed',
      customer_name: lead.full_name,
      customer_email: lead.email,
      meet_url: null,
      calendar_event_id: null,
      reminder_sent_at: null,
      idempotency_key: idempotency_key || null,
    };

    // Insert booking (no .select() - anon SELECT blocked)
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData);

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      
      // Check if it's a duplicate slot (unique constraint violation)
      if (bookingError.code === '23505') {
        console.log('[Booking] Duplicate slot detected - returning 409');
        return NextResponse.json(
          { ok: false, error: 'This time slot is no longer available. Please select another.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to create booking',
          details: bookingError.message,
        },
        { status: 500 }
      );
    }

    console.log('[Booking] ✓ DB insert successful - proceeding with email');
    
    // Retrieve booking ID using service_role
    const { data: insertedBooking } = await serviceSupabase
      .from('bookings')
      .select('id')
      .eq('lead_id', lead_id)
      .eq('selected_start', booking_start_utc)
      .single();
    
    const bookingId = insertedBooking?.id || 'unknown';
    console.log('[Booking] Created booking:', bookingId);
    
    // Email display time validation (already computed above)
    console.log('[Booking] ===== EMAIL DISPLAY TIME =====');
    console.log('[Booking] Email will show:', emailDisplayTime);
    console.log('[Booking] Timezone:', booking_timezone, '(GMT+4)');
    console.log('[Booking] =====================================');

    // Try to create Google Calendar event (optional)
    let meetUrl = null;
    let calendarEventId = null;
    let calendarStatus = 'not_configured';

    try {
      console.log('[Booking] Attempting Google Calendar event creation...');
      console.log('[Booking] Calendar timezone:', booking_timezone);
      console.log('[Booking] Calendar start (UTC):', booking_start_utc);
      console.log('[Booking] Calendar end (UTC):', booking_end_utc);
      
      const calendarResult = await createCalendarEvent({
        summary: 'Google Ads Audit Call',
        description: `Google Ads audit consultation with ${lead.full_name}`,
        start: booking_start_utc,
        end: booking_end_utc,
        attendeeEmail: lead.email,
        timezone: booking_timezone,
      });

      if (calendarResult) {
        meetUrl = calendarResult.meetUrl;
        calendarEventId = calendarResult.eventId;
        calendarStatus = 'synced';

        console.log('[Booking] ✓ Calendar event created successfully:', {
          eventId: calendarEventId,
          meetUrl: meetUrl,
          htmlLink: calendarResult.htmlLink,
        });
      } else {
        calendarStatus = 'pending_calendar_sync';
        console.log('[Booking] ⚠ Calendar integration not configured - booking created without calendar event');
      }

      // Update booking with calendar details
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          meet_url: meetUrl,
          calendar_event_id: calendarEventId,
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('[Booking] Error updating booking with calendar details:', updateError);
      } else {
        console.log('[Booking] Updated booking with Meet link and event ID');
      }
    } catch (calendarError: any) {
      calendarStatus = 'calendar_error';
      console.warn('[Booking] ⚠ Failed to create calendar event (booking still created):', {
        error: calendarError,
        message: calendarError?.message,
        response: calendarError?.response?.data,
      });
    }

    // ALWAYS send confirmation email via Resend (independent of Google Calendar)
    console.log('[Booking] Sending confirmation email via Resend...');
    
    // Derive base URL from request headers (no env var needed)
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    console.log('[Booking] Derived baseUrl:', baseUrl);

    const emailIdempotencyKey = `booking-confirmation-${bookingId}`;
    console.log('BOOKING_EMAIL_SEND_START', { bookingId, customerEmail: lead.email, idempotencyKey: emailIdempotencyKey });
    
    try {
      // Check if email already sent
      const { data: existingEmail } = await serviceSupabase
        .from('email_sends')
        .select('id')
        .eq('idempotency_key', emailIdempotencyKey)
        .single();
      
      if (existingEmail) {
        console.log('BOOKING_EMAIL_SEND_SKIPPED_DUPLICATE', { bookingId, idempotencyKey: emailIdempotencyKey });
        console.log('[Booking] ⊘ Confirmation email already sent (duplicate skipped)');
      } else {
        const emailResult = await sendConfirmationEmail({
          customerName: lead.full_name,
          customerEmail: lead.email,
          dateTime: emailDisplayTime,
          endTime: emailDisplayEndTime,
          timezone: booking_timezone,
          meetingLink: meetUrl || undefined,
          bookingId: bookingId,
          baseUrl,
        });

        if (emailResult.success) {
          // Track email send
          await serviceSupabase.from('email_sends').insert({
            idempotency_key: emailIdempotencyKey,
            email_type: 'confirmation',
            recipient_email: lead.email,
            booking_id: bookingId,
            resend_id: emailResult.emailId,
          });
          
          console.log('BOOKING_EMAIL_SEND_SUCCESS', { bookingId, emailId: emailResult.emailId });
          console.log('[Booking] ✓ Confirmation email sent successfully:', emailResult.emailId);
        } else {
          console.error('BOOKING_EMAIL_SEND_FAILED', { bookingId, error: emailResult.error, retryable: true });
          console.error('[Booking] ✗ Failed to send confirmation email:', emailResult.error);
        }
      }
    } catch (emailError: any) {
      console.error('BOOKING_EMAIL_SEND_FATAL_ERROR', { bookingId, error: emailError.message, retryable: false });
      console.error('[Booking] ✗ Fatal error sending confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Create reminder job for 1 hour before booking
    const reminderTime = new Date(new Date(booking_start_utc).getTime() - 60 * 60 * 1000);
    console.log('BOOKING_REMINDER_JOB_CREATE', { bookingId, scheduledFor: reminderTime.toISOString() });
    
    try {
      await serviceSupabase.from('reminder_jobs').insert({
        booking_id: bookingId,
        scheduled_for: reminderTime.toISOString(),
        status: 'pending',
      });
      console.log('[Booking] ✓ Reminder job created for:', reminderTime.toISOString());
    } catch (jobError) {
      console.error('BOOKING_REMINDER_JOB_FAILED', { bookingId, error: jobError });
      console.error('[Booking] ✗ Failed to create reminder job:', jobError);
    }
    
    // STAGE 5: Capture attribution data server-side
    const finalSessionId = session_id || generateSessionId();
    const attributionData = extractAttributionData(request, {
      session_id: finalSessionId,
      request_id: requestId,
      lead_id,
      booking_id: bookingId,
    });
    
    await saveAttributionEvent(attributionData);
    
    console.log('BOOKING_ATTRIBUTION_CAPTURED', {
      requestId,
      bookingId,
      leadId: lead_id,
      utm_source: attributionData.utm_source,
      gclid: attributionData.gclid,
      fbclid: attributionData.fbclid,
    });
    
    // STAGE 5: Enqueue conversion events
    if (attributionData.gclid) {
      await enqueueConversionEvent({
        event_type: 'booking_created',
        lead_id,
        booking_id: bookingId,
        provider: 'google_ads',
        conversion_value: 500, // Estimated value - update based on your pricing
        currency: 'USD',
      });
      console.log('CONVERSION_ENQUEUE', { requestId, bookingId, provider: 'google_ads', event: 'booking_created' });
    }
    
    if (attributionData.fbclid) {
      await enqueueConversionEvent({
        event_type: 'booking_created',
        lead_id,
        booking_id: bookingId,
        provider: 'meta_capi',
        conversion_value: 500,
        currency: 'USD',
      });
      console.log('CONVERSION_ENQUEUE', { requestId, bookingId, provider: 'meta_capi', event: 'booking_created' });
    }
    
    const duration_ms = Date.now() - requestStartTime;
    console.log('BOOKING_CREATE_SUCCESS', { requestId, bookingId, duration_ms });

    return NextResponse.json({
      ok: true,
      booking_id: bookingId,
      meet_url: meetUrl,
      calendar_event_id: calendarEventId,
      calendar_status: calendarStatus,
      message: calendarStatus === 'not_configured'
        ? 'Booking confirmed. Calendar integration not configured.'
        : calendarStatus === 'pending_calendar_sync'
        ? 'Booking confirmed. Calendar event pending.'
        : calendarStatus === 'calendar_error'
        ? 'Booking confirmed but calendar event failed.'
        : 'Booking confirmed with calendar event.',
    });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkSlotAvailability(
  start: string,
  end: string,
  supabase: any
): Promise<boolean> {
  // Check if there's any confirmed booking that overlaps with this time slot
  const startTime = new Date(start).toISOString();
  const endTime = new Date(end).toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select('selected_start, selected_end')
    .eq('status', 'confirmed')
    .lte('selected_start', endTime)
    .gte('selected_end', startTime);

  if (error) {
    console.error('Error checking availability:', error);
    return false;
  }

  // Check for actual overlap in JavaScript (more reliable than SQL)
  if (data && data.length > 0) {
    const requestStart = new Date(start).getTime();
    const requestEnd = new Date(end).getTime();

    for (const booking of data) {
      const bookingStart = new Date(booking.selected_start).getTime();
      const bookingEnd = new Date(booking.selected_end).getTime();

      // Check for overlap: booking starts before slot ends AND booking ends after slot starts
      if (bookingStart < requestEnd && bookingEnd > requestStart) {
        return false; // Slot is not available
      }
    }
  }

  return true; // Slot is available
}
