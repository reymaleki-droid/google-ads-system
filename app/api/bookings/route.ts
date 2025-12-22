import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, selected_start, selected_end } = body;

    // Validate input
    if (!lead_id || !selected_start || !selected_end) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: lead_id, selected_start, selected_end' },
        { status: 400 }
      );
    }

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

    // Verify the slot is still available
    const isAvailable = await checkSlotAvailability(selected_start, selected_end, supabase);
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
      console.error('Error fetching lead:', leadError);
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Create booking
    const bookingData = {
      lead_id,
      selected_start,
      selected_end,
      timezone: 'Asia/Dubai',
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

    // Create Google Calendar event
    let meetUrl = null;
    let calendarEventId = null;

    try {
      console.log('[Booking] Creating Google Calendar event...');
      const calendarResult = await createCalendarEvent({
        summary: 'Google Ads Audit Call',
        description: `Google Ads audit consultation with ${lead.full_name}`,
        start: selected_start,
        end: selected_end,
        attendeeEmail: lead.email,
        timezone: 'Asia/Dubai',
      });

      meetUrl = calendarResult.meetUrl;
      calendarEventId = calendarResult.eventId;

      console.log('[Booking] Calendar event created successfully:', {
        eventId: calendarEventId,
        meetUrl: meetUrl,
        htmlLink: calendarResult.htmlLink,
      });

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
      console.error('[Booking] Failed to create Google Calendar event:', {
        error: calendarError,
        message: calendarError?.message,
        response: calendarError?.response?.data,
      });
      
      // Don't fail the booking if calendar creation fails
      // The booking is already created, just log the error
      console.warn('[Booking] Booking created but calendar event failed. Continuing...');
    }

    return NextResponse.json({
      ok: true,
      booking_id: booking.id,
      meet_url: meetUrl,
      calendar_event_id: calendarEventId,
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
