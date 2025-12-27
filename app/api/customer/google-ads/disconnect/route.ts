/**
 * Customer Google Ads - Disconnect
 * 
 * POST /api/customer/google-ads/disconnect
 * 
 * Disconnects customer's Google Ads account by marking status as 'disconnected'.
 * Clears cached report data.
 * 
 * Security: Customer can only disconnect their own account (RLS enforced)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { disconnectCustomerGoogleAds } from '@/lib/google-ads-customer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('[Customer Google Ads] Disconnect requested...');

  try {
    // Create Supabase client to check auth
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

    // Disconnect account
    await disconnectCustomerGoogleAds(user.id);

    console.log('[Customer Google Ads] ✓ Account disconnected');

    return NextResponse.json({
      ok: true,
      message: 'Google Ads account disconnected successfully',
    });
  } catch (error: any) {
    console.error('[Customer Google Ads] Error disconnecting:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Ads account' },
      { status: 500 }
    );
  }
}
