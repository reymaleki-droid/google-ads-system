import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generates an ICS calendar file for a booking
 * GET /api/ics?booking_id=<uuid>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking_id parameter' },
        { status: 400 }
      );
    }

    // Fetch booking details
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ICS] Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, selected_start, selected_end, customer_name, customer_email, meet_url, local_start_display')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      console.error('[ICS] Booking not found:', bookingId, error);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Parse UTC timestamps
    const startDate = new Date(booking.selected_start);
    const endDate = new Date(booking.selected_end);

    // Format dates for ICS (YYYYMMDDTHHMMSSZ format in UTC)
    const formatICSDate = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    };

    const dtstart = formatICSDate(startDate);
    const dtend = formatICSDate(endDate);
    const dtstamp = formatICSDate(new Date());

    // Build description
    let description = 'Google Ads Audit Call\\n\\n';
    if (booking.meet_url) {
      description += `Join meeting: ${booking.meet_url}\\n\\n`;
    }
    description += 'We look forward to helping you optimize your Google Ads campaigns!';

    // Generate ICS content (RFC 5545 format)
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Google Ads Audit//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${bookingId}@audit-booking-system.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:Google Ads Audit Call`,
      `DESCRIPTION:${description}`,
      `ORGANIZER;CN=Audit Team:mailto:onboarding@resend.dev`,
      `ATTENDEE;CN=${booking.customer_name};RSVP=TRUE:mailto:${booking.customer_email}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      booking.meet_url ? `LOCATION:${booking.meet_url}` : '',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Meeting starts in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(line => line !== '').join('\r\n');

    console.log('[ICS] Generated calendar file for booking:', bookingId);

    // Return ICS file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="google-ads-audit-${bookingId.substring(0, 8)}.ics"`,
      },
    });

  } catch (error) {
    console.error('[ICS] Error generating calendar file:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}
