import { NextRequest, NextResponse } from 'next/server';
import { createOAuthClient, supabaseServer } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('[Google OAuth] Callback received:', {
      hasCode: !!code,
      hasError: !!error,
      error: error,
    });

    // Check for errors from Google
    if (error) {
      console.error('[Google OAuth] Error from Google:', error);
      return NextResponse.redirect(
        new URL(`/admin/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      console.error('[Google OAuth] Missing authorization code');
      return NextResponse.redirect(
        new URL('/admin/integrations?error=missing_code', request.url)
      );
    }

    console.log('[Google OAuth] Creating OAuth client...');
    const oAuth2Client = createOAuthClient();

    console.log('[Google OAuth] Exchanging code for tokens...');
    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);

    console.log('[Google OAuth] Tokens received:', {
      hasRefreshToken: !!tokens.refresh_token,
      hasAccessToken: !!tokens.access_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });

    // Validate that we received a refresh token
    if (!tokens.refresh_token) {
      console.error('[Google OAuth] No refresh token received. User may have already granted access.');
      return NextResponse.redirect(
        new URL(
          '/admin/integrations?error=no_refresh_token&message=' +
            encodeURIComponent(
              'No refresh token received. Please revoke existing permissions in your Google Account (https://myaccount.google.com/permissions) and try again.'
            ),
          request.url
        )
      );
    }

    // Upsert tokens to database
    const tokenData = {
      provider: 'google',
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token || null,
      scope: tokens.scope || null,
      token_type: tokens.token_type || null,
      expiry_date: tokens.expiry_date || null,
    };

    console.log('[Google OAuth] Checking for existing token in database...');
    // Check if a token already exists
    const { data: existingToken, error: selectError } = await supabaseServer
      .from('google_tokens')
      .select('id')
      .eq('provider', 'google')
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[Google OAuth] Error checking existing token:', selectError);
      throw new Error(`Database select error: ${selectError.message}`);
    }

    if (existingToken) {
      console.log('[Google OAuth] Updating existing token...');
      // Update existing token
      const { error: updateError } = await supabaseServer
        .from('google_tokens')
        .update(tokenData)
        .eq('provider', 'google');

      if (updateError) {
        console.error('[Google OAuth] Error updating Google tokens:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        throw new Error(`Database update error: ${updateError.message} (${updateError.code})`);
      }
      console.log('[Google OAuth] Token updated successfully');
    } else {
      console.log('[Google OAuth] Inserting new token...');
      // Insert new token
      const { error: insertError } = await supabaseServer
        .from('google_tokens')
        .insert(tokenData);

      if (insertError) {
        console.error('[Google OAuth] Error inserting Google tokens:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        });
        throw new Error(`Database insert error: ${insertError.message} (${insertError.code})`);
      }
      console.log('[Google OAuth] Token inserted successfully');
    }

    console.log('[Google OAuth] Success! Redirecting to integrations page...');
    // Redirect to admin integrations page with success message
    return NextResponse.redirect(
      new URL('/admin/integrations?google=connected', request.url)
    );
  } catch (error) {
    console.error('[Google OAuth] Fatal error in callback:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(
        `/admin/integrations?error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }
}
