import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Basic Auth removed - using Google OAuth instead
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
