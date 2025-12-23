import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TOKEN_EXPIRY_MINUTES = 15;

// Rate limiting: 5 requests per minute (same as other endpoints)
const retrieveRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });

// Generate cryptographically secure token
export async function generateLeadToken(leadId: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Generate 32 bytes (256 bits) random token
  const tokenBytes = randomBytes(32);
  const token = tokenBytes.toString('base64url');
  
  // Store SHA-256 hash in database
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  // Store token with expiration
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  const { error } = await supabase
    .from('retrieval_tokens')
    .insert({
      token_hash: tokenHash,
      lead_id: leadId,
      expires_at: expiresAt.toISOString()
    });
  
  if (error) {
    console.error('Failed to store token:', error);
    throw new Error('Token generation failed');
  }
  
  return token;
}

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
