// Conversion Events Worker
// Processes queued conversion events and sends to ad platforms

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendGoogleAdsConversion, hashForGoogleAds } from '@/lib/providers/google-ads';
import { sendMetaCapiEvent, hashForMeta, buildFbcFromFbclid } from '@/lib/providers/meta-capi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute

const MAX_PROCESSING_TIME = 55000; // 55 seconds (leave buffer)
const BATCH_SIZE = 10; // Process up to 10 events per run
const MAX_ATTEMPTS = 3; // Maximum retry attempts

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const secret = request.nextUrl.searchParams.get('secret');

  // Verify cron secret
  if (secret !== process.env.CRON_SECRET) {
    console.error('[ConversionWorker] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('CONVERSION_WORKER_START', { timestamp: new Date().toISOString() });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[ConversionWorker] Missing Supabase configuration');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    const now = new Date();
    const bufferEnd = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute buffer

    // Fetch pending events that are ready for processing
    // Include failed events where retry_after has passed
    const { data: events, error: fetchError } = await supabase
      .from('conversion_events')
      .select('*')
      .or(`status.eq.pending,and(status.eq.failed,retry_after.lt.${now.toISOString()})`)
      .lt('attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('[ConversionWorker] Error fetching events:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      console.log('[ConversionWorker] No events to process');
      return NextResponse.json({ ok: true, processed: 0 });
    }

    console.log(`[ConversionWorker] Found ${events.length} events to process`);

    // Process each event
    for (const event of events) {
      // Check time limit
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        console.log('[ConversionWorker] Time limit reached, stopping processing');
        break;
      }

      results.processed++;

      // Atomic claim: Update status to 'processing'
      const { error: lockError } = await supabase
        .from('conversion_events')
        .update({
          status: 'processing',
          last_attempt_at: new Date().toISOString(),
          attempts: event.attempts + 1,
        })
        .eq('id', event.id)
        .eq('status', event.status); // Only update if still in original status

      if (lockError) {
        console.log('[ConversionWorker] Event already claimed:', event.id);
        results.skipped++;
        continue;
      }

      console.log('CONVERSION_SEND_START', {
        eventId: event.id,
        eventType: event.event_type,
        provider: event.provider,
        attempt: event.attempts + 1,
      });

      try {
        // Fetch related data (lead/booking + attribution)
        const entityId = event.booking_id || event.lead_id;
        if (!entityId) {
          throw new Error('Event missing both booking_id and lead_id');
        }

        // Fetch attribution data
        const { data: attribution } = await supabase
          .from('attribution_events')
          .select('*')
          .or(`booking_id.eq.${entityId},lead_id.eq.${entityId}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Fetch lead data for user info
        const { data: lead } = await supabase
          .from('leads')
          .select('email, phone_e164')
          .eq('id', event.lead_id)
          .single();

        // Process based on provider
        let result;
        if (event.provider === 'google_ads') {
          result = await processGoogleAdsConversion(event, attribution, lead);
        } else if (event.provider === 'meta_capi') {
          result = await processMetaCapiConversion(event, attribution, lead);
        } else {
          throw new Error(`Unknown provider: ${event.provider}`);
        }

        if (result.success) {
          // Mark as sent
          await supabase
            .from('conversion_events')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              provider_response: result.response,
            })
            .eq('id', event.id);

          console.log('CONVERSION_SEND_SUCCESS', {
            eventId: event.id,
            provider: event.provider,
            eventType: event.event_type,
          });

          results.success++;
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error: any) {
        console.error('CONVERSION_SEND_ERROR', {
          eventId: event.id,
          provider: event.provider,
          error: error.message,
          retryable: event.attempts < MAX_ATTEMPTS - 1,
        });

        // Determine retry strategy
        const nextAttempt = event.attempts + 1;
        const shouldRetry = nextAttempt < MAX_ATTEMPTS;
        const retryDelay = Math.pow(2, nextAttempt) * 60 * 1000; // Exponential: 2min, 4min, 8min
        const retry_after = shouldRetry
          ? new Date(Date.now() + retryDelay).toISOString()
          : null;

        // Mark as failed (or pending for retry)
        await supabase
          .from('conversion_events')
          .update({
            status: shouldRetry ? 'failed' : 'failed',
            error_message: error.message,
            error_code: error.code || 'unknown',
            retry_after,
          })
          .eq('id', event.id);

        results.failed++;
        results.errors.push(`Event ${event.id}: ${error.message}`);
      }
    }

    const duration_ms = Date.now() - startTime;
    console.log('CONVERSION_WORKER_COMPLETE', {
      processed: results.processed,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
      duration_ms,
    });

    return NextResponse.json({
      ok: true,
      ...results,
      duration_ms,
    });
  } catch (error: any) {
    console.error('CONVERSION_WORKER_ERROR', { error: error.message });
    return NextResponse.json(
      { error: 'Worker error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process Google Ads conversion
 */
async function processGoogleAdsConversion(
  event: any,
  attribution: any,
  lead: any
): Promise<{ success: boolean; error?: string; response?: any }> {
  // Check if we have gclid
  if (!attribution?.gclid) {
    return {
      success: false,
      error: 'Missing gclid - cannot send Google Ads conversion without click ID',
    };
  }

  // Hash user data
  const hashedEmail = lead?.email ? await hashForGoogleAds(lead.email) : undefined;
  const hashedPhone = lead?.phone_e164 ? await hashForGoogleAds(lead.phone_e164) : undefined;

  // Build conversion payload
  const payload = {
    gclid: attribution.gclid,
    conversion_action: process.env.GOOGLE_ADS_CONVERSION_ACTION_ID || '',
    conversion_time: event.created_at,
    conversion_value: event.conversion_value,
    currency: event.currency,
    email: hashedEmail,
    phone: hashedPhone,
    order_id: event.dedupe_key, // Use dedupe_key for Google's dedupe
  };

  return await sendGoogleAdsConversion(payload);
}

/**
 * Process Meta CAPI conversion
 */
async function processMetaCapiConversion(
  event: any,
  attribution: any,
  lead: any
): Promise<{ success: boolean; error?: string; response?: any }> {
  // Hash user data
  const hashedEmail = lead?.email ? await hashForMeta(lead.email) : undefined;
  const hashedPhone = lead?.phone_e164 ? await hashForMeta(lead.phone_e164) : undefined;

  // Build FBC from fbclid if present
  const fbc = attribution?.fbclid
    ? buildFbcFromFbclid(attribution.fbclid, Math.floor(new Date(event.created_at).getTime() / 1000))
    : undefined;

  // Map event types to Meta event names
  const eventNameMap: Record<string, string> = {
    lead_created: 'Lead',
    booking_created: 'Schedule',
    booking_confirmed: 'CompleteRegistration',
    call_completed: 'Contact',
  };

  const payload = {
    event_name: eventNameMap[event.event_type] || 'Lead',
    event_time: Math.floor(new Date(event.created_at).getTime() / 1000),
    event_id: event.dedupe_key,
    event_source_url: attribution?.landing_path
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}${attribution.landing_path}`
      : undefined,
    action_source: 'website' as const,
    user_data: {
      em: hashedEmail,
      ph: hashedPhone,
      client_ip_address: undefined, // IP not stored for privacy
      client_user_agent: undefined, // UA not stored for privacy
      fbc,
      fbp: undefined, // Would need to capture from client cookie
    },
    custom_data: {
      value: event.conversion_value,
      currency: event.currency,
      content_name: event.event_type,
    },
  };

  return await sendMetaCapiEvent(payload);
}
