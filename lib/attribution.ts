// Attribution Capture Utilities
// Server-side attribution tracking for ads campaigns

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface AttributionData {
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Platform Click IDs
  gclid?: string;
  wbraid?: string;
  gbraid?: string;
  fbclid?: string;
  
  // Context
  referrer?: string;
  landing_path: string;
  
  // Session
  session_id: string;
  request_id?: string;
  
  // Privacy-safe hashes
  ip_hash?: string;
  user_agent_hash?: string;
  
  // Entity linkage
  lead_id?: string;
  booking_id?: string;
  
  // Raw params for debugging
  raw_params?: Record<string, any>;
}

/**
 * Extract attribution data from request
 * Captures UTM params, click IDs, referrer, etc.
 */
export function extractAttributionData(
  request: NextRequest,
  options: {
    session_id: string;
    request_id?: string;
    lead_id?: string;
    booking_id?: string;
  }
): AttributionData {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Extract UTM parameters
  const utm_source = searchParams.get('utm_source') || undefined;
  const utm_medium = searchParams.get('utm_medium') || undefined;
  const utm_campaign = searchParams.get('utm_campaign') || undefined;
  const utm_content = searchParams.get('utm_content') || undefined;
  const utm_term = searchParams.get('utm_term') || undefined;
  
  // Extract platform click IDs
  const gclid = searchParams.get('gclid') || undefined;
  const wbraid = searchParams.get('wbraid') || undefined;
  const gbraid = searchParams.get('gbraid') || undefined;
  const fbclid = searchParams.get('fbclid') || undefined;
  
  // Extract referrer and landing path
  const referrer = request.headers.get('referer') || undefined;
  const landing_path = url.pathname;
  
  // Privacy-safe hashing
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const user_agent = request.headers.get('user-agent') || 'unknown';
  
  const ip_hash = hashValue(ip);
  const user_agent_hash = hashValue(user_agent);
  
  // Collect all params for debugging
  const raw_params: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    raw_params[key] = value;
  });
  
  return {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    gclid,
    wbraid,
    gbraid,
    fbclid,
    referrer,
    landing_path,
    session_id: options.session_id,
    request_id: options.request_id,
    ip_hash,
    user_agent_hash,
    lead_id: options.lead_id,
    booking_id: options.booking_id,
    raw_params: Object.keys(raw_params).length > 0 ? raw_params : undefined,
  };
}

/**
 * Persist attribution data to database
 * Uses service_role to bypass RLS
 */
export async function saveAttributionEvent(data: AttributionData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Attribution] Missing Supabase configuration');
      return { success: false, error: 'Missing configuration' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase.from('attribution_events').insert(data);
    
    if (error) {
      console.error('[Attribution] Failed to save:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Attribution] Saved successfully:', {
      session_id: data.session_id,
      utm_source: data.utm_source,
      gclid: data.gclid,
      fbclid: data.fbclid,
      lead_id: data.lead_id,
      booking_id: data.booking_id,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('[Attribution] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate dedupe key for conversion events
 * Format: SHA-256(entity_id + event_type + provider)
 */
export function generateConversionDedupeKey(
  entityId: string,
  eventType: string,
  provider: string
): string {
  const value = `${entityId}-${eventType}-${provider}`;
  return hashValue(value);
}

/**
 * Enqueue conversion event for processing
 * Implements deduplication via unique dedupe_key
 */
export async function enqueueConversionEvent(params: {
  event_type: 'lead_created' | 'lead_qualified' | 'booking_created' | 'booking_confirmed' | 'reminder_sent' | 'call_completed';
  lead_id?: string;
  booking_id?: string;
  provider: 'google_ads' | 'meta_capi' | 'internal';
  conversion_value?: number;
  currency?: string;
}): Promise<{ success: boolean; error?: string; dedupe_skipped?: boolean }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Conversion] Missing Supabase configuration');
      return { success: false, error: 'Missing configuration' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generate dedupe key
    const entityId = params.booking_id || params.lead_id || 'unknown';
    const dedupe_key = generateConversionDedupeKey(entityId, params.event_type, params.provider);
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('conversion_events')
      .select('id, status')
      .eq('dedupe_key', dedupe_key)
      .single();
    
    if (existing) {
      console.log('[Conversion] Dedupe skip - already exists:', {
        dedupe_key,
        existing_id: existing.id,
        status: existing.status,
      });
      return { success: true, dedupe_skipped: true };
    }
    
    // Insert new conversion event
    const { error } = await supabase.from('conversion_events').insert({
      event_type: params.event_type,
      lead_id: params.lead_id,
      booking_id: params.booking_id,
      provider: params.provider,
      dedupe_key,
      status: 'pending',
      conversion_value: params.conversion_value,
      currency: params.currency || 'USD',
    });
    
    if (error) {
      // Check if it's a unique constraint violation (race condition)
      if (error.code === '23505') {
        console.log('[Conversion] Dedupe skip - race condition:', dedupe_key);
        return { success: true, dedupe_skipped: true };
      }
      console.error('[Conversion] Failed to enqueue:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Conversion] Enqueued successfully:', {
      event_type: params.event_type,
      provider: params.provider,
      dedupe_key,
      lead_id: params.lead_id,
      booking_id: params.booking_id,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('[Conversion] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Hash a value using SHA-256
 */
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a signed session ID (simple implementation)
 * In production, use a more robust signing mechanism
 */
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${random}`;
}

/**
 * Validate session ID signature
 * Returns true if valid, false otherwise
 */
export function validateSessionId(sessionId: string): boolean {
  // Simple validation: check format
  const parts = sessionId.split('-');
  if (parts.length !== 2) return false;
  
  const timestamp = parseInt(parts[0], 10);
  if (isNaN(timestamp)) return false;
  
  // Check if not too old (24 hours)
  const age = Date.now() - timestamp;
  if (age > 24 * 60 * 60 * 1000) return false;
  
  return true;
}
