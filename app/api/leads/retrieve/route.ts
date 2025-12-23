import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting: 5 requests per minute (same as other endpoints)
const retrieveRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });

// Verify and consume token (single-use)
async function consumeToken(token: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Hash the provided token
    const tokenHash = createHash('sha256').update(token).digest('hex');
    
    // Atomically mark token as used and retrieve lead_id
    // This prevents race conditions and ensures single-use
    const { data, error } = await supabase
      .from('retrieval_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('lead_id')
      .single();
    
    if (error || !data) {
      // Token is invalid, expired, or already used
      return null;
    }
    
    return data.lead_id;
  } catch {
    return null;
  }
}

// Endpoint: GET /api/leads/retrieve?token=xxx
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = retrieveRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Missing token' },
      { status: 400 }
    );
  }
  
  // Consume token (single-use, atomic operation)
  const leadId = await consumeToken(token);
  
  if (!leadId) {
    return NextResponse.json(
      { ok: false, error: 'Invalid, expired, or already used token' },
      { status: 401 }
    );
  }
  
  // Use service_role to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: 'Lead not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ ok: true, lead: data });
}
