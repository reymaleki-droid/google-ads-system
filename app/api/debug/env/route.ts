import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ENFORCE_PHONE_VERIFICATION: process.env.ENFORCE_PHONE_VERIFICATION,
    SMS_PROVIDER: process.env.SMS_PROVIDER,
    NODE_ENV: process.env.NODE_ENV,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
