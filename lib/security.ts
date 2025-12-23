// Security & Abuse Detection Utilities
// Logs suspicious events and validates requests

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface SuspiciousEventData {
  event_type?: string;
  endpoint?: string;
  method?: string;
  ip_address?: string;
  user_agent?: string;
  ip_hash?: string;
  user_agent_hash?: string;
  reason_code?:
    | 'rate_limit_exceeded'
    | 'honeypot_triggered'
    | 'invalid_payload'
    | 'replay_attack'
    | 'timing_anomaly'
    | 'missing_session'
    | 'invalid_signature'
    | 'suspicious_pattern';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  session_id?: string;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Log a suspicious event to the database
 * Uses async but doesn't block the request
 */
export function logSuspiciousEvent(data: SuspiciousEventData): void {
  // Fire and forget - don't block the request
  saveSuspiciousEvent(data).catch((error) => {
    console.error('[Security] Failed to log suspicious event:', error);
  });
}

/**
 * Save suspicious event to database
 */
async function saveSuspiciousEvent(data: SuspiciousEventData): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Security] Missing Supabase configuration');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('suspicious_events').insert({
      endpoint: data.endpoint,
      method: data.method,
      ip_hash: data.ip_hash ? hashValue(data.ip_hash) : null, // Only hash if provided
      user_agent_hash: data.user_agent_hash ? hashValue(data.user_agent_hash) : null,
      reason_code: data.reason_code,
      details: data.details,
      session_id: data.session_id,
      severity: data.severity || 'medium',
    } as any); // Type assertion for new tables

    if (error) {
      console.error('[Security] Error saving suspicious event:', error);
    } else {
      console.log('SUSPICIOUS_EVENT_LOGGED', {
        reason: data.reason_code,
        endpoint: data.endpoint,
        severity: data.severity,
      });
    }
  } catch (error) {
    console.error('[Security] Exception in saveSuspiciousEvent:', error);
  }
}

/**
 * Validate session ID format and age
 */
export function validateSessionId(sessionId: string): boolean {
  if (!sessionId) return false;

  const parts = sessionId.split('-');
  if (parts.length !== 2) return false;

  const timestamp = parseInt(parts[0], 10);
  if (isNaN(timestamp)) return false;

  // Check if not too old (24 hours)
  const age = Date.now() - timestamp;
  if (age > 24 * 60 * 60 * 1000) return false;

  return true;
}

/**
 * Validate request timing (anti-bot)
 * Checks if form submission took reasonable time
 */
export function validateRequestTiming(
  clientTimestamp: number | undefined,
  options: {
    minMs?: number; // Minimum time (default 2s)
    maxMs?: number; // Maximum time (default 10min)
  } = {}
): { valid: boolean; elapsed?: number } {
  if (!clientTimestamp) {
    return { valid: false };
  }

  const now = Date.now();
  const elapsed = now - clientTimestamp;

  const minMs = options.minMs || 2000; // 2 seconds minimum
  const maxMs = options.maxMs || 600000; // 10 minutes maximum

  const valid = elapsed >= minMs && elapsed <= maxMs;

  return { valid, elapsed };
}

/**
 * Validate payload schema (basic validation)
 * Returns array of missing fields
 */
export function validateRequiredFields(
  payload: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Hash a value using SHA-256
 */
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Check for replay attack
 * Request IDs should be unique and recent
 */
const seenRequestIds = new Map<string, number>();

export function checkReplayAttack(requestId: string): boolean {
  const now = Date.now();

  // Clean up old entries (older than 5 minutes)
  for (const [id, timestamp] of seenRequestIds.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      seenRequestIds.delete(id);
    }
  }

  // Check if we've seen this request ID
  if (seenRequestIds.has(requestId)) {
    return true; // Replay detected
  }

  // Record this request ID
  seenRequestIds.set(requestId, now);
  return false;
}

/**
 * Detect suspicious patterns in payload
 * Returns array of detected patterns
 */
export function detectSuspiciousPatterns(payload: any): string[] {
  const patterns: string[] = [];

  const payloadStr = JSON.stringify(payload).toLowerCase();

  // SQL injection patterns
  if (/(\bunion\b|\bselect\b|\bdrop\b|\binsert\b|\bupdate\b|\bdelete\b)/i.test(payloadStr)) {
    patterns.push('sql_injection_attempt');
  }

  // XSS patterns
  if (/<script|javascript:|onerror=|onload=/i.test(payloadStr)) {
    patterns.push('xss_attempt');
  }

  // Path traversal
  if (/\.\.[/\\]|%2e%2e/i.test(payloadStr)) {
    patterns.push('path_traversal_attempt');
  }

  // Command injection
  if (/[;&|`$(){}[\]]/g.test(payloadStr)) {
    patterns.push('command_injection_attempt');
  }

  return patterns;
}
