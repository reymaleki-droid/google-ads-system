import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone } from 'date-fns-tz';
import { sendReminderEmail } from '@/lib/email';
import { validateEnvironment } from '@/lib/env-check';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validate environment variables on module load
if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}

/**
 * Vercel Cron Job: Send 1-hour reminder emails
 * 
 * This endpoint is called every 10 minutes by Vercel Cron
 * It finds bookings starting in 55-65 minutes and sends reminder emails
 * 
 * GET /api/cron/reminders
 * 
 * Authorization: Vercel Cron Secret (set in vercel.json)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security - STRICT validation
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // CRON_SECRET must be set and must match
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron Reminders] Unauthorized request - missing or invalid cron secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron Reminders] ===== STARTING REMINDER CHECK =====');
    console.log('[Cron Reminders] Current time (UTC):', new Date().toISOString());

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Cron Reminders] Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate time window: 55-65 minutes from now
    const now = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000); // 55 minutes
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);   // 65 minutes

    console.log('[Cron Reminders] Time window:', {
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    });

    // Query bookings that need reminders
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, selected_start, selected_end, booking_timezone, meet_url, local_start_display')
      .eq('status', 'confirmed')
      .is('reminder_sent_at', null)
      .gte('selected_start', windowStart.toISOString())
      .lte('selected_start', windowEnd.toISOString());

    if (error) {
      console.error('[Cron Reminders] Error querying bookings:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log('[Cron Reminders] No bookings need reminders in this window');
      return NextResponse.json({
        ok: true,
        processed: 0,
        message: 'No reminders to send',
      });
    }

    console.log(`[Cron Reminders] Found ${bookings.length} booking(s) needing reminders`);

    // Process each booking
    const results = [];
    
    // Derive base URL from request headers (no env var needed)
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    console.log('[Cron Reminders] Derived baseUrl:', baseUrl);

    for (const booking of bookings) {
      console.log(`[Cron Reminders] Processing booking ${booking.id} for ${booking.customer_email}`);

      try {
        // Format display time for the email
        const startDate = new Date(booking.selected_start);
        const dateTime = booking.local_start_display || formatInTimeZone(
          startDate,
          booking.booking_timezone || 'Asia/Dubai',
          'EEEE, MMMM d, yyyy \'at\' h:mm a'
        );

        const endDate = new Date(booking.selected_end);
        const endTime = formatInTimeZone(
          endDate,
          booking.booking_timezone || 'Asia/Dubai',
          'h:mm a'
        );

        // Send reminder email
        const emailResult = await sendReminderEmail({
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          dateTime,
          endTime,
          timezone: booking.booking_timezone || 'Asia/Dubai',
          meetingLink: booking.meet_url || undefined,
          bookingId: booking.id,
          baseUrl,
        });

        if (emailResult.success) {
          // Update reminder_sent_at timestamp
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ reminder_sent_at: now.toISOString() })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`[Cron Reminders] Failed to update reminder_sent_at for ${booking.id}:`, updateError);
            results.push({
              booking_id: booking.id,
              status: 'email_sent_but_update_failed',
              error: updateError.message,
            });
          } else {
            console.log(`[Cron Reminders] ✓ Reminder sent and logged for booking ${booking.id}`);
            results.push({
              booking_id: booking.id,
              status: 'success',
              email_id: emailResult.emailId,
            });
          }
        } else {
          console.error(`[Cron Reminders] Failed to send reminder for ${booking.id}:`, emailResult.error);
          results.push({
            booking_id: booking.id,
            status: 'email_failed',
            error: emailResult.error,
          });
        }
      } catch (bookingError) {
        console.error(`[Cron Reminders] Error processing booking ${booking.id}:`, bookingError);
        results.push({
          booking_id: booking.id,
          status: 'error',
          error: bookingError instanceof Error ? bookingError.message : 'Unknown error',
        });
      }
    }

    // Summary
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.length - successCount;

    console.log('[Cron Reminders] ===== REMINDER CHECK COMPLETE =====');
    console.log(`[Cron Reminders] Processed: ${results.length}`);
    console.log(`[Cron Reminders] Success: ${successCount}`);
    console.log(`[Cron Reminders] Failed: ${failedCount}`);
    console.log('[Cron Reminders] =======================================');

    return NextResponse.json({
      ok: true,
      processed: results.length,
      success: successCount,
      failed: failedCount,
      results,
    });

  } catch (error) {
    console.error('[Cron Reminders] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
