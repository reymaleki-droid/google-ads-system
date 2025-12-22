import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Booking Detail] Missing Supabase environment variables');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id: bookingId } = await context.params;

    console.log('[Booking Detail] Fetching booking:', bookingId);

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, selected_start, selected_end, meet_url, calendar_status, calendar_event_id')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('[Booking Detail] Error fetching booking:', error);
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('[Booking Detail] Found booking:', booking.id);

    return NextResponse.json({
      ok: true,
      booking
    });
  } catch (error) {
    console.error('[Booking Detail] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
