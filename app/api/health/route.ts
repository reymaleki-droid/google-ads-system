import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health check endpoint for operational monitoring
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: 'unknown',
      resend: 'unknown',
    },
  };

  try {
    // Check Supabase connectivity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from('leads').select('id').limit(1);
      health.checks.supabase = error ? 'unhealthy' : 'healthy';
    } else {
      health.checks.supabase = 'not_configured';
    }

    // Check Resend API key exists
    health.checks.resend = process.env.RESEND_API_KEY ? 'configured' : 'not_configured';

    // Determine overall status
    if (health.checks.supabase === 'unhealthy') {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    }, { status: 503 });
  }
}
