import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokensFromSupabase } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check if OAuth credentials are configured
    const hasCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    
    if (!hasCredentials) {
      console.log('[Google OAuth] Credentials not configured');
      return NextResponse.json({
        connected: false,
        configured: false,
        message: 'Google OAuth credentials not configured',
      });
    }
    
    const tokens = await getGoogleTokensFromSupabase();
    const isConnected = !!tokens && !!tokens.refresh_token;
    
    console.log('[Google OAuth] Status check:', { 
      configured: true,
      connected: isConnected,
      hasTokens: !!tokens,
      hasRefreshToken: !!tokens?.refresh_token,
    });
    
    return NextResponse.json({
      connected: isConnected,
      configured: true,
    });
  } catch (error) {
    console.error('Error checking Google connection status:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
