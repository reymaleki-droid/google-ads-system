import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Slots] Missing Supabase environment variables');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const timezone = 'Asia/Dubai';
    
    // Dubai is UTC+4
    const now = new Date();
    const dubaiOffset = 4 * 60; // minutes
    const dubaiNow = new Date(now.getTime() + (dubaiOffset - now.getTimezoneOffset()) * 60 * 1000);
    
    // Add 2 hours minimum lead time
    const earliestStart = new Date(dubaiNow.getTime() + 2 * 60 * 60 * 1000);

    // Fetch all confirmed bookings once for the next 7 days
    const endDate = new Date(earliestStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('selected_start, selected_end')
      .eq('status', 'confirmed')
      .gte('selected_start', earliestStart.toISOString())
      .lte('selected_start', endDate.toISOString());

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    const bookedSlots = existingBookings || [];

    const slots: TimeSlot[] = [];
    let currentDay = new Date(earliestStart);
    currentDay.setHours(0, 0, 0, 0);

    const maxSlots = 8;
    const maxDaysToCheck = 7;
    let daysChecked = 0;

    while (slots.length < maxSlots && daysChecked < maxDaysToCheck) {
      const daySlots = generateSlotsForDay(currentDay, earliestStart, bookedSlots, timezone, dubaiNow);
      slots.push(...daySlots);

      if (slots.length >= maxSlots) {
        break;
      }

      // Move to next day
      currentDay = new Date(currentDay);
      currentDay.setDate(currentDay.getDate() + 1);
      daysChecked++;
    }

    // Limit to exactly 8 slots
    const finalSlots = slots.slice(0, maxSlots);

    return NextResponse.json({
      ok: true,
      timezone,
      slots: finalSlots,
    });
  } catch (error) {
    console.error('Error generating slots:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate slots' },
      { status: 500 }
    );
  }
}

function generateSlotsForDay(
  day: Date,
  earliestStart: Date,
  bookedSlots: any[],
  timezone: string,
  dubaiNow: Date
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const workStart = 10; // 10:00
  const workEnd = 18; // 18:00
  const meetingDuration = 15; // minutes
  const buffer = 15; // minutes

  // Start at 10:00
  let currentTime = new Date(day);
  currentTime.setHours(workStart, 0, 0, 0);

  const endOfDay = new Date(day);
  endOfDay.setHours(workEnd, 0, 0, 0);

  while (currentTime < endOfDay) {
    const slotEnd = new Date(currentTime.getTime() + meetingDuration * 60 * 1000);

    // Check if this slot is in the future (respects 2-hour lead time)
    if (currentTime >= earliestStart) {
      // Check if this slot conflicts with existing bookings
      const isAvailable = checkSlotAvailability(
        currentTime.toISOString(),
        slotEnd.toISOString(),
        bookedSlots
      );

      if (isAvailable) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          label: formatSlotLabel(currentTime, timezone, dubaiNow),
        });
      }
    }

    // Move to next slot (meeting duration + buffer)
    currentTime = new Date(currentTime.getTime() + (meetingDuration + buffer) * 60 * 1000);
  }

  return slots;
}

function checkSlotAvailability(
  start: string,
  end: string,
  bookedSlots: any[]
): boolean {
  // Check if there's any booking that overlaps with this time slot
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  for (const booking of bookedSlots) {
    const bookingStart = new Date(booking.selected_start).getTime();
    const bookingEnd = new Date(booking.selected_end).getTime();

    // Check for overlap: booking starts before slot ends AND booking ends after slot starts
    if (bookingStart < endTime && bookingEnd > startTime) {
      return false; // Slot is not available
    }
  }

  return true; // Slot is available
}

function formatSlotLabel(date: Date, timezone: string, dubaiNow: Date): string {
  const slotDate = new Date(date);
  const dayDiff = Math.floor((slotDate.getTime() - dubaiNow.getTime()) / (1000 * 60 * 60 * 24));

  const hours = slotDate.getHours();
  const minutes = slotDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;

  if (dayDiff === 0) {
    return `Today, ${timeStr}`;
  } else if (dayDiff === 1) {
    return `Tomorrow, ${timeStr}`;
  } else {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStr = days[slotDate.getDay()];
    return `${dayStr}, ${timeStr}`;
  }
}
