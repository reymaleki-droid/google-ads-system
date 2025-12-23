import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Generate cryptographically secure token for lead retrieval
 */
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
  
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  // Store token hash with expiry
  const { error } = await supabase.from('retrieval_tokens').insert({
    token_hash: tokenHash,
    lead_id: leadId,
    expires_at: expiresAt.toISOString(),
  });
  
  if (error) {
    console.error('[Token] Failed to store token:', error);
    throw new Error('Failed to generate token');
  }
  
  return token;
}
