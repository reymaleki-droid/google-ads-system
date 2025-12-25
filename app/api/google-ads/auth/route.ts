/**
 * Google Ads OAuth Flow - Authorization Endpoint
 * 
 * GET /api/google-ads/auth
 * 
 * Initiates OAuth2 flow by redirecting user to Google's consent screen.
 * User grants permission for adwords scope, then Google redirects to callback.
 * 
 * Required Environment Variables:
 * - GOOGLE_ADS_CLIENT_ID
 * - GOOGLE_ADS_CLIENT_SECRET
 * - GOOGLE_ADS_REDIRECT_URI (should be http://localhost:3000/api/google-ads/callback or production URL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGoogleAdsOAuthClient } from '@/lib/google-ads-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('[Google Ads Auth] Initiating OAuth flow...');

  try {
    // Get redirect URI from request URL (dynamic for localhost vs production)
    const baseUrl = request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/google-ads/callback`;

    // Create OAuth2 client
    const oAuth2Client = createGoogleAdsOAuthClient(redirectUri);

    if (!oAuth2Client) {
      console.error('[Google Ads Auth] OAuth client not available - missing credentials');
      return NextResponse.json(
        { error: 'Google Ads integration not configured. Please set GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET.' },
        { status: 500 }
      );
    }

    // Generate authorization URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh_token
      scope: ['https://www.googleapis.com/auth/adwords'], // Google Ads API scope
      prompt: 'consent', // Force consent screen to always get refresh_token
    });

    console.log('[Google Ads Auth] ✓ Redirecting to Google consent screen:', authUrl);

    // Redirect to Google's OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[Google Ads Auth] ✗ Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Ads authentication', details: error.message },
      { status: 500 }
    );
  }
}
