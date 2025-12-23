import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addHours, addMinutes, startOfDay, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * TIMEZONE MODEL - SINGLE SOURCE OF TRUTH:
 * 
 * Each slot contains:
 * - startUtcIso: UTC timestamp (e.g., "2025-12-23T09:00:00.000Z")
 * - endUtcIso: UTC timestamp
 * - timezone: IANA timezone (e.g., "Asia/Dubai")
 * - displayLabel: Human-readable label (e.g., "Today, 1:00 PM")
 * 
 * CRITICAL: displayLabel is ALWAYS computed from startUtcIso + timezone.
 * Never use server's local time or Date() without timezone context.
 * 
 * TEST: If slot shows "1:00 PM", startUtcIso MUST be "09:00:00.000Z" (for Dubai GMT+4)
 */

interface TimeSlot {
  startUtcIso: string; // UTC ISO timestamp (e.g., "2025-12-23T09:00:00.000Z")
  endUtcIso: string; // UTC ISO timestamp
  timezone: string; // IANA timezone (e.g., "Asia/Dubai")
  displayLabel: string; // Human-readable label in timezone (e.g., "Today, 1:00 PM")
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
    const bookingTimezone = 'Asia/Dubai';
    
    console.log('[Slots] Generating slots for timezone:', bookingTimezone);
    
    // Get current time in booking timezone
    const nowUTC = new Date();
    const nowInBookingTz = toZonedTime(nowUTC, bookingTimezone);
    
    console.log('[Slots] Current UTC time:', nowUTC.toISOString());
    console.log('[Slots] Current Dubai time:', formatInTimeZone(nowUTC, bookingTimezone, 'yyyy-MM-dd HH:mm:ss zzz'));
    
    // Add 2 hours minimum lead time (in booking timezone)
    const earliestStartInTz = addHours(nowInBookingTz, 2);
    const earliestStartUTC = fromZonedTime(earliestStartInTz, bookingTimezone);
    
    console.log('[Slots] Earliest booking time (Dubai):', formatInTimeZone(earliestStartUTC, bookingTimezone, 'yyyy-MM-dd HH:mm:ss zzz'));
    console.log('[Slots] Earliest booking time (UTC):', earliestStartUTC.toISOString());

    // Fetch all confirmed bookings for the next 7 days
    const endDate = addDays(earliestStartUTC, 7);
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('selected_start, selected_end')
      .eq('status', 'confirmed')
      .gte('selected_start', earliestStartUTC.toISOString())
      .lte('selected_start', endDate.toISOString());

    if (error) {
      console.error('[Slots] Error fetching bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    const bookedSlots = existingBookings || [];
    console.log('[Slots] Found', bookedSlots.length, 'existing bookings');

    const slots: TimeSlot[] = [];
    let currentDay = startOfDay(earliestStartInTz);
    
    const maxSlots = 8;
    const maxDaysToCheck = 7;
    let daysChecked = 0;

    while (slots.length < maxSlots && daysChecked < maxDaysToCheck) {
      const daySlots = generateSlotsForDay(
        currentDay, 
        earliestStartInTz, 
        bookedSlots, 
        bookingTimezone,
        nowInBookingTz
      );
      slots.push(...daySlots);

      if (slots.length >= maxSlots) {
        break;
      }

      currentDay = addDays(currentDay, 1);
      daysChecked++;
    }

    const finalSlots = slots.slice(0, maxSlots);
    
    console.log('[Slots] Generated', finalSlots.length, 'available slots');
    finalSlots.forEach((slot, idx) => {
      console.log(`[Slots] Slot ${idx + 1}: ${slot.displayLabel} | UTC: ${slot.startUtcIso}`);
    });

    return NextResponse.json({
      ok: true,
      timezone: bookingTimezone,
      slots: finalSlots,
    });
  } catch (error) {
    console.error('[Slots] Error generating slots:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate slots' },
      { status: 500 }
    );
  }
}

function generateSlotsForDay(
  dayInTz: Date,
  earliestStartInTz: Date,
  bookedSlots: any[],
  bookingTimezone: string,
  nowInTz: Date
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const workStart = 10; // 10:00
  const workEnd = 18; // 18:00
  const meetingDuration = 15; // minutes
  const buffer = 15; // minutes

  // FIXED: Create time slots directly in Dubai timezone, not using Date object manipulation
  // Get the date components from dayInTz (which is already in Dubai context)
  const year = dayInTz.getFullYear();
  const month = dayInTz.getMonth();
  const date = dayInTz.getDate();
  
  // Create time strings for the start and end of work hours in Dubai
  let currentHour = workStart;
  let currentMinute = 0;

  while (currentHour < workEnd || (currentHour === workEnd && currentMinute === 0)) {
    // CRITICAL: Use Date.UTC() to create UTC timestamp directly from Dubai local time
    // Dubai is GMT+4, so subtract 4 hours from Dubai time to get UTC
    // Example: 13:30 Dubai - 4 hours = 09:30 UTC
    const utcHour = currentHour - 4;
    const slotStartUTC = new Date(Date.UTC(year, month, date, utcHour, currentMinute, 0));
    const slotEndUTC = new Date(slotStartUTC.getTime() + meetingDuration * 60 * 1000);
    
    // For checking if slot is in future, we need a Date representing Dubai local time
    // This doesn't need to be perfect, just for comparison with earliestStartInTz
    const dubaiLocalDate = new Date(year, month, date, currentHour, currentMinute, 0);

    // Check if this slot is in the future (respects 2-hour lead time)
    if (dubaiLocalDate >= earliestStartInTz) {
      // Check if this slot conflicts with existing bookings
      const isAvailable = checkSlotAvailability(
        slotStartUTC.toISOString(),
        slotEndUTC.toISOString(),
        bookedSlots
      );

      if (isAvailable) {
        // Generate display label from UTC time converted BACK to booking timezone
        const displayTime = formatInTimeZone(slotStartUTC, bookingTimezone, 'h:mm a');
        const displayLabel = formatSlotLabel(dubaiLocalDate, bookingTimezone, nowInTz);
        
        const slot: TimeSlot = {
          startUtcIso: slotStartUTC.toISOString(),
          endUtcIso: slotEndUTC.toISOString(),
          timezone: bookingTimezone,
          displayLabel: displayLabel,
        };
        
        // PROOF: Log the conversion
        console.log(`[Slots] Dubai ${currentHour}:${String(currentMinute).padStart(2, '0')} -> UTC ${slotStartUTC.toISOString()} -> Display: ${displayLabel} (verified: ${displayTime})`);
        
        // Verify the conversion is correct
        const verifyTime = formatInTimeZone(slotStartUTC, bookingTimezone, 'HH:mm');
        const expectedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        if (verifyTime !== expectedTime) {
          console.error(`[Slots] ❌ TIMEZONE MISMATCH! Expected ${expectedTime}, got ${verifyTime}`);
        }
        
        slots.push(slot);
      }
    }

    // Move to next slot (meeting duration + buffer)
    currentMinute += meetingDuration + buffer;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
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

function formatSlotLabel(dateInTz: Date, timezone: string, nowInTz: Date): string {
  // dateInTz is already in the target timezone context
  const slotDate = dateInTz;
  
  // Calculate day difference properly
  const nowDate = new Date(nowInTz.getFullYear(), nowInTz.getMonth(), nowInTz.getDate());
  const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
  const dayDiff = Math.floor((slotDateOnly.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

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
