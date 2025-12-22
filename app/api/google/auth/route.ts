import { NextRequest, NextResponse } from 'next/server';
import { createOAuthClient } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const oAuth2Client = createOAuthClient();

    // Generate auth URL with required scopes and settings
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });

    // Redirect user to Google's OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
