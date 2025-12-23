import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone } from 'date-fns-tz';
import { sendReminderEmail } from '@/lib/email';
import { validateEnvironment } from '@/lib/env-check';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}

/**
 * Worker endpoint for processing reminder jobs
 * Can be called frequently (every 5 minutes) or triggered externally
 * 
 * GET /api/workers/reminders?secret=<CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const secret = request.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || secret !== cronSecret) {
      console.error('REMINDER_WORKER_UNAUTHORIZED', { hasSecret: !!secret });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('REMINDER_WORKER_START', { timestamp: new Date().toISOString() });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('REMINDER_WORKER_CONFIG_ERROR', { error: 'Missing Supabase credentials' });
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending jobs that are due (with 5-minute buffer)
    const now = new Date();
    const bufferEnd = new Date(now.getTime() + 5 * 60 * 1000);

    const { data: jobs, error: fetchError } = await supabase
      .from('reminder_jobs')
      .select('id, booking_id, scheduled_for, attempts')
      .eq('status', 'pending')
      .lte('scheduled_for', bufferEnd.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('REMINDER_WORKER_FETCH_ERROR', { error: fetchError.message });
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('REMINDER_WORKER_NO_JOBS', { processed: 0 });
      return NextResponse.json({ ok: true, processed: 0, duration_ms: Date.now() - startTime });
    }

    console.log('REMINDER_WORKER_JOBS_FOUND', { count: jobs.length });

    const results = { success: 0, failed: 0, skipped: 0 };

    for (const job of jobs) {
      try {
        // Mark as processing (atomic update)
        const { error: lockError } = await supabase
          .from('reminder_jobs')
          .update({ 
            status: 'processing',
            last_attempt_at: new Date().toISOString(),
            attempts: job.attempts + 1,
          })
          .eq('id', job.id)
          .eq('status', 'pending');

        if (lockError) {
          console.log('REMINDER_WORKER_JOB_LOCKED', { jobId: job.id });
          results.skipped++;
          continue;
        }

        // Fetch booking details
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('id, customer_name, customer_email, selected_start, selected_end, booking_timezone, meet_url, reminder_sent_at')
          .eq('id', job.booking_id)
          .eq('status', 'confirmed')
          .single();

        if (bookingError || !booking) {
          console.error('REMINDER_WORKER_BOOKING_NOT_FOUND', { jobId: job.id, bookingId: job.booking_id });
          await supabase.from('reminder_jobs').update({ 
            status: 'failed',
            error_message: 'Booking not found or not confirmed',
          }).eq('id', job.id);
          results.failed++;
          continue;
        }

        // Check if reminder already sent (idempotency)
        if (booking.reminder_sent_at) {
          console.log('REMINDER_WORKER_ALREADY_SENT', { jobId: job.id, bookingId: booking.id, sentAt: booking.reminder_sent_at });
          await supabase.from('reminder_jobs').update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          }).eq('id', job.id);
          results.skipped++;
          continue;
        }

        // Send reminder email with retry logic
        const emailIdempotencyKey = `booking-reminder-${booking.id}`;
        
        // Check email deduplication
        const { data: existingEmail } = await supabase
          .from('email_sends')
          .select('id')
          .eq('idempotency_key', emailIdempotencyKey)
          .single();

        if (existingEmail) {
          console.log('REMINDER_WORKER_EMAIL_DUPLICATE_SKIPPED', { jobId: job.id, bookingId: booking.id });
          await supabase.from('bookings').update({ 
            reminder_sent_at: new Date().toISOString(),
          }).eq('id', booking.id);
          await supabase.from('reminder_jobs').update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          }).eq('id', job.id);
          results.skipped++;
          continue;
        }

        // Format display times
        const displayTime = formatInTimeZone(
          new Date(booking.selected_start),
          booking.booking_timezone,
          'EEEE, MMMM d, yyyy \'at\' h:mm a'
        );
        const displayEndTime = formatInTimeZone(
          new Date(booking.selected_end),
          booking.booking_timezone,
          'h:mm a'
        );

        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const host = request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        console.log('REMINDER_WORKER_EMAIL_SEND_START', { jobId: job.id, bookingId: booking.id, email: booking.customer_email });

        const emailResult = await withRetry(
          () => sendReminderEmail({
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            dateTime: displayTime,
            endTime: displayEndTime,
            timezone: booking.booking_timezone,
            meetingLink: booking.meet_url || undefined,
            bookingId: booking.id,
            baseUrl,
          }),
          { maxAttempts: 3, delayMs: 1000 }
        );

        if (emailResult.success) {
          // Track email send
          await supabase.from('email_sends').insert({
            idempotency_key: emailIdempotencyKey,
            email_type: 'reminder',
            recipient_email: booking.customer_email,
            booking_id: booking.id,
            resend_id: emailResult.emailId,
          });

          // Mark reminder as sent
          await supabase.from('bookings').update({ 
            reminder_sent_at: new Date().toISOString(),
          }).eq('id', booking.id);

          // Mark job as completed
          await supabase.from('reminder_jobs').update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          }).eq('id', job.id);

          console.log('REMINDER_WORKER_EMAIL_SEND_SUCCESS', { jobId: job.id, bookingId: booking.id, emailId: emailResult.emailId });
          results.success++;
        } else {
          throw new Error(emailResult.error || 'Email send failed');
        }
      } catch (jobError: any) {
        console.error('REMINDER_WORKER_JOB_ERROR', { 
          jobId: job.id, 
          bookingId: job.booking_id, 
          error: jobError.message,
          retryable: job.attempts < 3,
        });

        // Mark as failed or pending for retry
        const newStatus = job.attempts >= 3 ? 'failed' : 'pending';
        await supabase.from('reminder_jobs').update({ 
          status: newStatus,
          error_message: jobError.message,
        }).eq('id', job.id);

        results.failed++;
      }
    }

    const duration = Date.now() - startTime;
    console.log('REMINDER_WORKER_COMPLETE', { ...results, duration_ms: duration });

    return NextResponse.json({
      ok: true,
      processed: results.success + results.failed + results.skipped,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
      duration_ms: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('REMINDER_WORKER_FATAL_ERROR', { error: error.message, duration_ms: duration });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delayMs: number }
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log('RETRY_ATTEMPT', { attempt, maxAttempts: options.maxAttempts, error: error.message });
      
      if (attempt < options.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, options.delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}
