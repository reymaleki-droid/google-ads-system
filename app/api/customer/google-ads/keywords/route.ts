/**
 * Customer Google Ads - Keyword Performance
 * 
 * GET /api/customer/google-ads/keywords?dateRange=LAST_30_DAYS
 * 
 * Fetches keyword performance data for authenticated customer.
 * Returns cached data if available (30-minute TTL).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { fetchCustomerKeywordPerformance } from '@/lib/google-ads-customer';
import { formatKeywordForTable } from '@/lib/google-ads-formatters';

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

    // Fetch keywords
    console.log('[Customer Google Ads] Fetching keywords:', { customerId: user.id, dateRange });

    const keywords = await fetchCustomerKeywordPerformance(user.id, dateRange);

    // Format for display
    const formattedKeywords = keywords.map((k) => formatKeywordForTable(k));

    return NextResponse.json({
      ok: true,
      keywords: formattedKeywords,
      count: keywords.length,
      dateRange,
    });
  } catch (error: any) {
    console.error('[Customer Google Ads] Error fetching keywords:', error);

    if (error.message === 'No Google Ads account connected') {
      return NextResponse.json(
        { error: 'No Google Ads account connected', connected: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
  }
}
