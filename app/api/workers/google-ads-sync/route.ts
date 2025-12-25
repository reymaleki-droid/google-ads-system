/**
 * Google Ads Data Sync Worker
 * 
 * Runs every 6 hours via Vercel cron
 * Syncs conversion data for all active conversion events
 * 
 * Job: Fetch conversion events → Upload to Google Ads → Mark as synced
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthorizedGoogleAdsClient, uploadOfflineConversion } from '@/lib/google-ads-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max execution

const BATCH_SIZE = 50; // Process 50 conversions per run
const MAX_RETRY_ATTEMPTS = 3;

interface ConversionEvent {
  id: string;
  event_type: string;
  lead_id: string | null;
  booking_id: string | null;
  provider: string;
  conversion_value: number | null;
  currency: string;
  attempts: number;
  status: string;
}

interface Lead {
  email: string;
  phone_e164: string;
}

interface Booking {
  lead_id: string;
}

interface AttributionEvent {
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(JSON.stringify({
    event: 'GOOGLE_ADS_SYNC_START',
    requestId,
    timestamp: new Date().toISOString(),
  }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any;

  try {
    // 1. Check if Google Ads is configured
    const adsClient = await getAuthorizedGoogleAdsClient();
    
    if (!adsClient) {
      console.log('GOOGLE_ADS_SYNC_SKIPPED', { reason: 'not_configured' });
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'Google Ads not configured',
      });
    }

    // 2. Fetch pending conversion events for Google Ads
    const { data: events, error: fetchError } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('provider', 'google_ads')
      .in('status', ['pending', 'failed'])
      .lt('attempts', MAX_RETRY_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('GOOGLE_ADS_SYNC_FETCH_ERROR', { error: fetchError.message });
      return NextResponse.json(
        { error: 'Failed to fetch conversion events' },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      console.log('GOOGLE_ADS_SYNC_COMPLETE', { processed: 0, reason: 'no_pending_events' });
      return NextResponse.json({
        ok: true,
        processed: 0,
        message: 'No pending events',
      });
    }

    console.log('GOOGLE_ADS_SYNC_FETCHED', { count: events.length });

    // 3. Process each conversion event
    let successCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    for (const event of events as ConversionEvent[]) {
      try {
        // Atomic claim: Mark as processing
        const { error: claimError } = await supabase
          .from('conversion_events')
          .update({
            status: 'processing',
            attempts: event.attempts + 1,
            last_attempt_at: new Date().toISOString(),
          } as any)
          .eq('id', event.id)
          .eq('status', event.status); // Prevent race condition

        if (claimError) {
          console.warn('GOOGLE_ADS_SYNC_CLAIM_FAILED', { eventId: event.id });
          continue; // Skip if another worker claimed it
        }

        // Fetch lead data
        let leadEmail: string | null = null;
        let leadPhone: string | null = null;

        if (event.lead_id) {
          const { data: lead } = await supabase
            .from('leads')
            .select('email, phone_e164')
            .eq('id', event.lead_id)
            .single();

          if (lead) {
            leadEmail = (lead as Lead).email;
            leadPhone = (lead as Lead).phone_e164;
          }
        } else if (event.booking_id) {
          // Fetch lead via booking
          const { data: booking } = await supabase
            .from('bookings')
            .select('lead_id')
            .eq('id', event.booking_id)
            .single();

          if (booking) {
            const { data: lead } = await supabase
              .from('leads')
              .select('email, phone_e164')
              .eq('id', (booking as Booking).lead_id)
              .single();

            if (lead) {
              leadEmail = (lead as Lead).email;
              leadPhone = (lead as Lead).phone_e164;
            }
          }
        }

        // Fetch attribution data (gclid)
        let gclid: string | null = null;
        let gbraid: string | null = null;
        let wbraid: string | null = null;

        const { data: attribution } = await supabase
          .from('attribution_events')
          .select('gclid, gbraid, wbraid')
          .or(`lead_id.eq.${event.lead_id},booking_id.eq.${event.booking_id}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (attribution) {
          gclid = (attribution as AttributionEvent).gclid;
          gbraid = (attribution as AttributionEvent).gbraid;
          wbraid = (attribution as AttributionEvent).wbraid;
        }

        // Check if we have required data
        if (!gclid && !gbraid && !wbraid) {
          console.warn('GOOGLE_ADS_SYNC_SKIP_NO_CLICK_ID', { eventId: event.id });
          
          // Mark as failed (no gclid means we can't sync)
          await supabase
            .from('conversion_events')
            .update({
              status: 'failed',
              error_message: 'No gclid/gbraid/wbraid found',
            } as any)
            .eq('id', event.id);

          failedCount++;
          continue;
        }

        // Upload to Google Ads
        const uploadResult = await uploadOfflineConversion({
          gclid: gclid || undefined,
          gbraid: gbraid || undefined,
          wbraid: wbraid || undefined,
          conversionAction: process.env.GOOGLE_ADS_CONVERSION_ACTION_ID!,
          conversionDateTime: new Date().toISOString(),
          conversionValue: event.conversion_value || undefined,
          currencyCode: event.currency,
          userIdentifierEmail: leadEmail || undefined,
          userIdentifierPhone: leadPhone || undefined,
        });

        if (!uploadResult.success) {
          console.error('GOOGLE_ADS_UPLOAD_ERROR', {
            eventId: event.id,
            error: uploadResult.error,
            retryable: uploadResult.retryable,
          });

          // Mark as failed or retry
          await supabase
            .from('conversion_events')
            .update({
              status: event.attempts + 1 >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending',
              error_message: uploadResult.error,
              retry_after: uploadResult.retryable
                ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min
                : null,
            } as any)
            .eq('id', event.id);

          failedCount++;
          results.push({
            eventId: event.id,
            status: 'failed',
            error: uploadResult.error,
          });
          continue;
        }

        // Mark as synced
        await supabase
          .from('conversion_events')
          .update({
            status: 'sent',
            synced_at: new Date().toISOString(),
            external_id: uploadResult.jobId,
          } as any)
          .eq('id', event.id);

        successCount++;
        results.push({
          eventId: event.id,
          status: 'synced',
          jobId: uploadResult.jobId,
        });

        console.log('GOOGLE_ADS_CONVERSION_SYNCED', {
          eventId: event.id,
          jobId: uploadResult.jobId,
        });

      } catch (error: any) {
        console.error('GOOGLE_ADS_SYNC_EVENT_ERROR', {
          eventId: event.id,
          error: error.message,
        });

        // Mark as failed
        await supabase
          .from('conversion_events')
          .update({
            status: 'failed',
            error_message: error.message,
          } as any)
          .eq('id', event.id);

        failedCount++;
        results.push({
          eventId: event.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    console.log(JSON.stringify({
      event: 'GOOGLE_ADS_SYNC_COMPLETE',
      requestId,
      duration_ms: duration,
      processed: events.length,
      success: successCount,
      failed: failedCount,
    }));

    return NextResponse.json({
      ok: true,
      processed: events.length,
      success: successCount,
      failed: failedCount,
      duration_ms: duration,
      results,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(JSON.stringify({
      event: 'GOOGLE_ADS_SYNC_ERROR',
      requestId,
      error: error.message,
      duration_ms: duration,
    }));

    return NextResponse.json(
      { error: 'Sync worker failed', details: error.message },
      { status: 500 }
    );
  }
}
