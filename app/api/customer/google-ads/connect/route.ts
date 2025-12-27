/**
 * Customer Google Ads OAuth - Start Flow
 * 
 * GET /api/customer/google-ads/connect
 * 
 * Starts OAuth flow for customer to connect their own Google Ads account.
 * Redirects to Google consent screen with read-only scope.
 * 
 * Security: Requires authenticated customer (auth.uid())
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('[Customer Google Ads] Initiating OAuth flow...');

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
      return NextResponse.redirect(new URL('/login?redirectTo=/app/integrations', request.url));
    }

    // Check environment variables
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[Customer Google Ads] Missing OAuth credentials');
      return NextResponse.json(
        { error: 'Google Ads integration not configured' },
        { status: 500 }
      );
    }

    // Build OAuth URL
    const baseUrl = request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/customer/google-ads/callback`;
    const state = user.id; // Customer ID for callback verification

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords'); // READ-ONLY
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    console.log('[Customer Google Ads] ✓ Redirecting to Google consent screen');

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('[Customer Google Ads] Error:', error);
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 });
  }
}
