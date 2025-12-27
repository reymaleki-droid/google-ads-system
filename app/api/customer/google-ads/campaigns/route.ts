/**
 * Customer Google Ads - Campaign Performance
 * 
 * GET /api/customer/google-ads/campaigns?dateRange=LAST_30_DAYS
 * 
 * Fetches campaign performance data for authenticated customer.
 * Returns cached data if available (30-minute TTL).
 * 
 * Query Params:
 * - dateRange: TODAY | YESTERDAY | LAST_7_DAYS | LAST_14_DAYS | LAST_30_DAYS | THIS_MONTH | LAST_MONTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { fetchCustomerCampaignPerformance } from '@/lib/google-ads-customer';
import { formatCampaignForTable, calculateCampaignSummary } from '@/lib/google-ads-formatters';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'LAST_30_DAYS';

    // Fetch campaigns
    console.log('[Customer Google Ads] Fetching campaigns:', { customerId: user.id, dateRange });

    const campaigns = await fetchCustomerCampaignPerformance(user.id, dateRange);

    // Format for display
    const formattedCampaigns = campaigns.map((c) => formatCampaignForTable(c));

    // Calculate summary
    const summary = calculateCampaignSummary(campaigns);

    return NextResponse.json({
      ok: true,
      campaigns: formattedCampaigns,
      summary,
      count: campaigns.length,
      dateRange,
    });
  } catch (error: any) {
    console.error('[Customer Google Ads] Error fetching campaigns:', error);

    if (error.message === 'No Google Ads account connected') {
      return NextResponse.json(
        { error: 'No Google Ads account connected', connected: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
