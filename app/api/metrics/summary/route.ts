// Metrics Summary Endpoint
// Protected endpoint for KPI tracking and monitoring

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Verify admin/cron secret
  if (secret !== process.env.CRON_SECRET && secret !== process.env.ADMIN_SECRET) {
    console.error('[Metrics] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Metrics] Missing Supabase configuration');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch metrics in parallel
    const [
      leadsLast24h,
      leadsLast7d,
      bookingsLast24h,
      bookingsLast7d,
      conversionEventStats,
      leadsBySource,
      bookingsBySource,
      topLandingPaths,
      suspiciousEventsLast24h,
    ] = await Promise.all([
      // Leads count (24h)
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last24h.toISOString()),

      // Leads count (7d)
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last7d.toISOString()),

      // Bookings count (24h)
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last24h.toISOString()),

      // Bookings count (7d)
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last7d.toISOString()),

      // Conversion event stats
      supabase
        .from('conversion_events')
        .select('status, provider')
        .gte('created_at', last24h.toISOString()),

      // Leads by source (7d)
      supabase
        .from('attribution_events')
        .select('utm_source, lead_id')
        .gte('created_at', last7d.toISOString())
        .not('lead_id', 'is', null),

      // Bookings by source (7d)
      supabase
        .from('attribution_events')
        .select('utm_source, utm_campaign, booking_id')
        .gte('created_at', last7d.toISOString())
        .not('booking_id', 'is', null),

      // Top landing paths (7d)
      supabase
        .from('attribution_events')
        .select('landing_path')
        .gte('created_at', last7d.toISOString()),

      // Suspicious events (24h)
      supabase
        .from('suspicious_events')
        .select('reason_code, severity')
        .gte('created_at', last24h.toISOString()),
    ]);

    // Process conversion event stats
    const conversionStats = {
      total: conversionEventStats.data?.length || 0,
      sent: conversionEventStats.data?.filter((e: any) => e.status === 'sent').length || 0,
      pending: conversionEventStats.data?.filter((e: any) => e.status === 'pending').length || 0,
      failed: conversionEventStats.data?.filter((e: any) => e.status === 'failed').length || 0,
      by_provider: {
        google_ads: conversionEventStats.data?.filter((e: any) => e.provider === 'google_ads').length || 0,
        meta_capi: conversionEventStats.data?.filter((e: any) => e.provider === 'meta_capi').length || 0,
      },
      success_rate:
        conversionEventStats.data && conversionEventStats.data.length > 0
          ? (
              (conversionEventStats.data.filter((e: any) => e.status === 'sent').length /
                conversionEventStats.data.length) *
              100
            ).toFixed(2)
          : '0.00',
    };

    // Process leads by source
    const sourceMap = new Map<string, number>();
    leadsBySource.data?.forEach((attr: any) => {
      const source = attr.utm_source || 'direct';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });
    const leadsBySourceArray = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Process bookings by source/campaign
    const campaignMap = new Map<string, { source: string; campaign: string; count: number }>();
    bookingsBySource.data?.forEach((attr: any) => {
      const source = attr.utm_source || 'direct';
      const campaign = attr.utm_campaign || 'none';
      const key = `${source}|${campaign}`;
      const existing = campaignMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        campaignMap.set(key, { source, campaign, count: 1 });
      }
    });
    const bookingsByCampaignArray = Array.from(campaignMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Process landing paths
    const pathMap = new Map<string, number>();
    topLandingPaths.data?.forEach((attr: any) => {
      const path = attr.landing_path || '/';
      pathMap.set(path, (pathMap.get(path) || 0) + 1);
    });
    const topPathsArray = Array.from(pathMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Process suspicious events
    const suspiciousMap = new Map<string, number>();
    suspiciousEventsLast24h.data?.forEach((event: any) => {
      const reason = event.reason_code;
      suspiciousMap.set(reason, (suspiciousMap.get(reason) || 0) + 1);
    });
    const suspiciousArray = Array.from(suspiciousMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const metrics = {
      timestamp: now.toISOString(),
      period: {
        last_24h: last24h.toISOString(),
        last_7d: last7d.toISOString(),
      },
      leads: {
        last_24h: leadsLast24h.count || 0,
        last_7d: leadsLast7d.count || 0,
        by_source_7d: leadsBySourceArray,
      },
      bookings: {
        last_24h: bookingsLast24h.count || 0,
        last_7d: bookingsLast7d.count || 0,
        by_campaign_7d: bookingsByCampaignArray,
      },
      conversions: {
        last_24h: conversionStats,
      },
      landing_paths: {
        top_10_7d: topPathsArray,
      },
      security: {
        suspicious_events_24h: suspiciousEventsLast24h.count || 0,
        by_reason: suspiciousArray,
      },
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('[Metrics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}
