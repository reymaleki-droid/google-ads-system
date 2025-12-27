/**
 * Customer Google Ads OAuth - Callback
 * 
 * GET /api/customer/google-ads/callback?code=...&state=...
 * 
 * Handles OAuth callback, exchanges code for tokens, stores in database.
 * Redirects customer to integrations page with success message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('[Customer Google Ads Callback] Handling OAuth callback...');

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // customer_id
    const error = searchParams.get('error');

    if (error) {
      console.error('[Customer Google Ads Callback] OAuth error:', error);
      return NextResponse.redirect(
        new URL('/app/integrations?error=oauth_denied', request.url)
      );
    }

    if (!code || !state) {
      console.error('[Customer Google Ads Callback] Missing code or state');
      return NextResponse.redirect(
        new URL('/app/integrations?error=invalid_callback', request.url)
      );
    }

    const customerId = state;

    // Exchange code for tokens
    const baseUrl = request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/customer/google-ads/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Customer Google Ads Callback] Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/app/integrations?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get customer info from Google Ads API
    const customerIdWithoutDashes = await getGoogleAdsCustomerId(tokens.access_token);

    if (!customerIdWithoutDashes) {
      return NextResponse.redirect(
        new URL('/app/integrations?error=no_ads_account', request.url)
      );
    }

    // Store tokens in database (service_role for RLS bypass)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('google_ads_accounts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('google_ads_customer_id', customerIdWithoutDashes)
      .single();

    if (existingAccount) {
      // Update existing
      await supabase
        .from('google_ads_accounts')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);
    } else {
      // Insert new
      await supabase.from('google_ads_accounts').insert({
        customer_id: customerId,
        google_ads_customer_id: customerIdWithoutDashes,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        status: 'active',
      });
    }

    console.log('[Customer Google Ads Callback] ✓ Tokens stored successfully');

    return NextResponse.redirect(
      new URL('/app/integrations?google_ads=connected', request.url)
    );
  } catch (error: any) {
    console.error('[Customer Google Ads Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/app/integrations?error=callback_error', request.url)
    );
  }
}

/**
 * Get Google Ads customer ID from API
 */
async function getGoogleAdsCustomerId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://googleads.googleapis.com/v15/customers:listAccessibleCustomers',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        },
      }
    );

    if (!response.ok) {
      console.error('[Customer Google Ads] Failed to get customer ID');
      return null;
    }

    const data = await response.json();

    if (!data.resourceNames || data.resourceNames.length === 0) {
      console.error('[Customer Google Ads] No accessible customers found');
      return null;
    }

    // Extract customer ID from resource name (format: customers/1234567890)
    const customerId = data.resourceNames[0].split('/')[1];
    console.log('[Customer Google Ads] ✓ Customer ID:', customerId);

    return customerId;
  } catch (error: any) {
    console.error('[Customer Google Ads] Error getting customer ID:', error);
    return null;
  }
}
