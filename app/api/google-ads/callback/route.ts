/**
 * Google Ads OAuth Flow - Callback Endpoint
 * 
 * GET /api/google-ads/callback?code=...
 * 
 * Handles OAuth2 callback from Google after user grants consent.
 * Exchanges authorization code for access_token and refresh_token.
 * Stores tokens in google_ads_tokens table.
 * 
 * Required POST-OAuth Setup:
 * 1. User must manually add GOOGLE_ADS_DEVELOPER_TOKEN to environment variables
 * 2. User must manually add GOOGLE_ADS_CUSTOMER_ID to environment variables
 * 3. Tokens will be inactive until these are set (is_active = false initially)
 * 
 * Security:
 * - Uses service_role key to bypass RLS and insert tokens
 * - Only stores tokens for authenticated user's email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createGoogleAdsOAuthClient } from '@/lib/google-ads-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('[Google Ads Callback] Handling OAuth callback...');

  try {
    // Get authorization code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('[Google Ads Callback] OAuth error:', error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin/google-ads?error=oauth_denied`
      );
    }

    if (!code) {
      console.error('[Google Ads Callback] No authorization code received');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin/google-ads?error=no_code`
      );
    }

    // Create OAuth2 client with dynamic redirect URI
    const baseUrl = request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/google-ads/callback`;
    const oAuth2Client = createGoogleAdsOAuthClient(redirectUri);

    if (!oAuth2Client) {
      console.error('[Google Ads Callback] OAuth client not available');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin/google-ads?error=config_missing`
      );
    }

    // Exchange code for tokens
    console.log('[Google Ads Callback] Exchanging code for tokens...');
    const { tokens } = await oAuth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error('[Google Ads Callback] No refresh token received. User may have previously authorized.');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin/google-ads?error=no_refresh_token`
      );
    }

    console.log('[Google Ads Callback] ✓ Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expiry_date,
    });

    // Get user info to associate tokens with email
    oAuth2Client.setCredentials(tokens);
    const oauth2 = new (await import('googleapis')).google.auth.OAuth2();
    oauth2.setCredentials(tokens);
    
    let userEmail = 'unknown';
    try {
      const userInfo = await (await import('googleapis')).google.oauth2({ version: 'v2', auth: oauth2 }).userinfo.get();
      userEmail = userInfo.data.email || 'unknown';
    } catch (err) {
      console.warn('[Google Ads Callback] Could not fetch user email:', err);
    }

    // Create Supabase client with service_role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if tokens already exist for this user
    const { data: existingTokens } = await supabase
      .from('google_ads_tokens')
      .select('id')
      .eq('user_email', userEmail)
      .single();

    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type || 'Bearer',
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope,
      user_email: userEmail,
      // Developer token and customer_id must be set manually after OAuth
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || null,
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID || null,
      is_active: false, // Will be activated once developer_token and customer_id are set
      updated_at: new Date().toISOString(),
    };

    if (existingTokens) {
      // Update existing tokens
      const { error: updateError } = await supabase
        .from('google_ads_tokens')
        .update(tokenData)
        .eq('id', existingTokens.id);

      if (updateError) {
        console.error('[Google Ads Callback] Error updating tokens:', updateError);
        return NextResponse.redirect(
          `${request.nextUrl.origin}/admin/google-ads?error=db_update_failed`
        );
      }

      console.log('[Google Ads Callback] ✓ Tokens updated successfully');
    } else {
      // Insert new tokens
      const { error: insertError } = await supabase
        .from('google_ads_tokens')
        .insert(tokenData);

      if (insertError) {
        console.error('[Google Ads Callback] Error inserting tokens:', insertError);
        return NextResponse.redirect(
          `${request.nextUrl.origin}/admin/google-ads?error=db_insert_failed`
        );
      }

      console.log('[Google Ads Callback] ✓ Tokens saved successfully');
    }

    // Redirect to admin page with success
    return NextResponse.redirect(
      `${request.nextUrl.origin}/admin/google-ads?google_ads=connected`
    );
  } catch (error: any) {
    console.error('[Google Ads Callback] ✗ Error:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/admin/google-ads?error=unknown`
    );
  }
}
