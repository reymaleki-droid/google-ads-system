/**
 * Google Ads Connection Status Check
 * 
 * GET /api/google-ads/status
 * 
 * Checks if Google Ads OAuth tokens are configured and active.
 * Used by admin UI to show connection status.
 * 
 * Returns:
 * - connected: boolean
 * - customerIds: string[] (if MCC account)
 * - lastSyncedAt: string (timestamp of last successful sync)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsTokensFromSupabase } from '@/lib/google-ads-api';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const tokens = await getGoogleAdsTokensFromSupabase();

    if (!tokens || !tokens.refresh_token) {
      return NextResponse.json({
        connected: false,
        message: 'Google Ads not connected. Click "Connect Google Ads" to authorize.',
      });
    }

    // Check if tokens are active (developer_token and customer_id are set)
    if (!tokens.is_active || !tokens.developer_token || !tokens.customer_id) {
      return NextResponse.json({
        connected: 'partial',
        message: 'OAuth tokens received, but GOOGLE_ADS_DEVELOPER_TOKEN and GOOGLE_ADS_CUSTOMER_ID must be set in environment variables.',
        hasOAuth: true,
        hasDeveloperToken: !!tokens.developer_token,
        hasCustomerId: !!tokens.customer_id,
      });
    }

    // Fetch last sync timestamp from google_ads_sync_jobs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: lastSync } = await supabase
      .from('google_ads_sync_jobs')
      .select('completed_at, status')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch accessible customer IDs if available
    let customerIds: string[] = [];
    try {
      // This will be implemented once getAccessibleCustomers is working
      customerIds = [tokens.customer_id];
    } catch (err) {
      console.warn('[Google Ads Status] Could not fetch accessible customers:', err);
      customerIds = [tokens.customer_id];
    }

    return NextResponse.json({
      connected: true,
      customerIds,
      lastSyncedAt: lastSync?.completed_at || null,
      userEmail: tokens.user_email,
      hasRefreshToken: !!tokens.refresh_token,
      tokenExpiresAt: tokens.expires_at,
    });
  } catch (error: any) {
    console.error('[Google Ads Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check Google Ads status', details: error.message },
      { status: 500 }
    );
  }
}
