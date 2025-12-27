/**
 * Customer Google Ads - Connection Status
 * 
 * GET /api/customer/google-ads/status
 * 
 * Returns whether customer has connected Google Ads account and basic info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCustomerGoogleAdsAccount } from '@/lib/google-ads-customer';

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

    // Get account
    const account = await getCustomerGoogleAdsAccount(user.id);

    if (!account) {
      return NextResponse.json({
        ok: true,
        connected: false,
        message: 'No Google Ads account connected',
      });
    }

    return NextResponse.json({
      ok: true,
      connected: true,
      account: {
        google_ads_customer_id: account.google_ads_customer_id,
        account_name: account.account_name,
        currency_code: account.currency_code,
        status: account.status,
        connected_at: account.created_at,
        last_synced_at: account.updated_at,
      },
    });
  } catch (error: any) {
    console.error('[Customer Google Ads] Error checking status:', error);
    return NextResponse.json({ error: 'Failed to check connection status' }, { status: 500 });
  }
}
