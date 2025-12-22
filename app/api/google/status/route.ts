import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokensFromSupabase } from '@/lib/google';

export async function GET(request: NextRequest) {
  try {
    const tokens = await getGoogleTokensFromSupabase();
    
    return NextResponse.json({
      connected: !!tokens && !!tokens.refresh_token,
    });
  } catch (error) {
    console.error('Error checking Google connection status:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
