import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent } from '@/lib/google';
import { formatInTimeZone } from 'date-fns-tz';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  try {
    const body = await request.json();
    const { 
      lead_id, 
      booking_start_utc, 
      booking_end_utc, 
      booking_timezone = 'Asia/Dubai',
      selected_display_label 
    } = body;

    console.log('[Booking] ===== BOOKING REQUEST RECEIVED =====');
    console.log('[Booking] Lead ID:', lead_id);
    console.log('[Booking] Start UTC:', booking_start_utc);
    console.log('[Booking] End UTC:', booking_end_utc);
    console.log('[Booking] Timezone:', booking_timezone);
    console.log('[Booking] Selected Display Label:', selected_display_label);
    console.log('[Booking] ==========================================');

    // Validate input
    if (!lead_id || !booking_start_utc || !booking_end_utc) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: lead_id, booking_start_utc, booking_end_utc' },
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

    // Verify the slot is still available (using UTC timestamps)
    const isAvailable = await checkSlotAvailability(booking_start_utc, booking_end_utc, supabase);
    if (!isAvailable) {
      return NextResponse.json(
        { ok: false, error: 'This time slot is no longer available. Please select another.' },
        { status: 409 }
      );
    }

    // Fetch lead data to get customer name and email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('full_name, email')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      console.error('[Booking] Error fetching lead:', leadError);
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      );
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
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to create booking',
          details: bookingError.message,
        },
        { status: 500 }
      );
    }

    console.log('[Booking] Created booking:', booking.id);
    
    // RULE 5: Print proof that times match
    console.log('[Booking] ===== FINAL PROOF =====');
    console.log('[Booking] Booking ID:', booking.id);
    console.log('[Booking] Stored UTC Start:', booking.selected_start);
    console.log('[Booking] Stored Timezone:', booking.booking_timezone);
    console.log('[Booking] Stored Display Time:', booking.local_start_display);
    console.log('[Booking] Re-computed from stored UTC+TZ:', formatInTimeZone(new Date(booking.selected_start), booking.booking_timezone, 'h:mm a'));
    console.log('[Booking] ✓ ALL TIMES MUST MATCH');
    console.log('[Booking] =================================');

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
        .eq('id', booking.id);

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

    return NextResponse.json({
      ok: true,
      booking_id: booking.id,
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
