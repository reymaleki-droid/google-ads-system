#!/usr/bin/env node

/**
 * Stage 5 Verification Script
 * Verifies: Attribution, Conversion Tracking, Ads Integration, Bot Hardening, Metrics
 * 
 * Run: node scripts/verify-stage5.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passCount = 0;
let failCount = 0;

function test(description, assertion) {
  if (assertion) {
    console.log(`${GREEN}✓${RESET} ${description}`);
    passCount++;
    return true;
  } else {
    console.log(`${RED}✗${RESET} ${description}`);
    failCount++;
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(rootDir, filePath));
}

function fileContains(filePath, pattern) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return false;
  const content = fs.readFileSync(fullPath, 'utf-8');
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

console.log(`\n${BOLD}=== STAGE 5 VERIFICATION: Ads Launch Hardening & Conversion Integrity ===${RESET}\n`);

// ============================================================================
// TASK 1: Attribution Capture (Server-side)
// ============================================================================
console.log(`${BOLD}TASK 1: Attribution Capture${RESET}\n`);

test(
  'Migration 004 creates attribution_events table',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'CREATE TABLE IF NOT EXISTS attribution_events')
);

test(
  'attribution_events has UTM fields',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'utm_source TEXT') &&
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'utm_campaign TEXT')
);

test(
  'attribution_events has click ID fields (gclid, fbclid)',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'gclid TEXT') &&
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'fbclid TEXT')
);

test(
  'attribution_events has privacy-safe hashes (ip_hash, user_agent_hash)',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'ip_hash TEXT') &&
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'user_agent_hash TEXT')
);

test(
  'attribution_events has indexes for performance',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'CREATE INDEX idx_attribution_events_gclid') &&
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'CREATE INDEX idx_attribution_events_utm_source')
);

test(
  'Attribution utility exists (lib/attribution.ts)',
  fileExists('lib/attribution.ts')
);

test(
  'extractAttributionData function captures UTM params',
  fileContains('lib/attribution.ts', 'utm_source = searchParams.get') &&
  fileContains('lib/attribution.ts', 'utm_campaign')
);

test(
  'extractAttributionData captures click IDs (gclid, fbclid)',
  fileContains('lib/attribution.ts', 'gclid = searchParams.get') &&
  fileContains('lib/attribution.ts', 'fbclid = searchParams.get')
);

test(
  'saveAttributionEvent uses service_role',
  fileContains('lib/attribution.ts', 'SUPABASE_SERVICE_ROLE_KEY')
);

test(
  '/api/leads captures attribution server-side',
  fileContains('app/api/leads/route.ts', 'extractAttributionData') &&
  fileContains('app/api/leads/route.ts', 'saveAttributionEvent')
);

test(
  '/api/bookings captures attribution server-side',
  fileContains('app/api/bookings/route.ts', 'extractAttributionData') &&
  fileContains('app/api/bookings/route.ts', 'saveAttributionEvent')
);

// ============================================================================
// TASK 2: Conversion Dedupe + Source-of-truth
// ============================================================================
console.log(`\n${BOLD}TASK 2: Conversion Dedupe + Source-of-truth${RESET}\n`);

test(
  'Migration 004 creates conversion_events table',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'CREATE TABLE IF NOT EXISTS conversion_events')
);

test(
  'conversion_events has dedupe_key with UNIQUE constraint',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'dedupe_key TEXT NOT NULL UNIQUE')
);

test(
  'conversion_events has event_type field',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', "event_type TEXT NOT NULL CHECK")
);

test(
  'conversion_events has provider field (google_ads, meta_capi)',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', "provider TEXT NOT NULL CHECK (provider IN ('google_ads', 'meta_capi'")
);

test(
  'conversion_events has status field (pending, processing, sent, failed)',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', "status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed'")
);

test(
  'conversion_events has retry fields (attempts, retry_after)',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'attempts INT NOT NULL DEFAULT 0') &&
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'retry_after TIMESTAMPTZ')
);

test(
  'enqueueConversionEvent function exists',
  fileContains('lib/attribution.ts', 'export async function enqueueConversionEvent')
);

test(
  'enqueueConversionEvent checks for duplicates',
  fileContains('lib/attribution.ts', "select('id, status')") &&
  fileContains('lib/attribution.ts', "eq('dedupe_key'")
);

test(
  'enqueueConversionEvent handles race condition (23505)',
  fileContains('lib/attribution.ts', "error.code === '23505'")
);

test(
  '/api/leads enqueues conversion events',
  fileContains('app/api/leads/route.ts', 'enqueueConversionEvent')
);

test(
  '/api/bookings enqueues conversion events',
  fileContains('app/api/bookings/route.ts', 'enqueueConversionEvent')
);

test(
  'Conversion events have structured logs (CONVERSION_ENQUEUE)',
  fileContains('app/api/leads/route.ts', 'CONVERSION_ENQUEUE') ||
  fileContains('app/api/bookings/route.ts', 'CONVERSION_ENQUEUE')
);

// ============================================================================
// TASK 3: Server-to-Server Ad Platforms
// ============================================================================
console.log(`\n${BOLD}TASK 3: Server-to-Server Ad Platforms${RESET}\n`);

test(
  'Google Ads provider module exists',
  fileExists('lib/providers/google-ads.ts')
);

test(
  'sendGoogleAdsConversion function exists',
  fileContains('lib/providers/google-ads.ts', 'export async function sendGoogleAdsConversion')
);

test(
  'Google Ads uses timeouts',
  fileContains('lib/providers/google-ads.ts', 'const API_TIMEOUT_MS')
);

test(
  'Google Ads uses retry logic',
  fileContains('lib/providers/google-ads.ts', 'withRetryAndTimeout')
);

test(
  'Google Ads checks for missing config',
  fileContains('lib/providers/google-ads.ts', 'GOOGLE_ADS_CUSTOMER_ID') &&
  fileContains('lib/providers/google-ads.ts', 'not configured')
);

test(
  'Meta CAPI provider module exists',
  fileExists('lib/providers/meta-capi.ts')
);

test(
  'sendMetaCapiEvent function exists',
  fileContains('lib/providers/meta-capi.ts', 'export async function sendMetaCapiEvent')
);

test(
  'Meta CAPI uses timeouts',
  fileContains('lib/providers/meta-capi.ts', 'const API_TIMEOUT_MS')
);

test(
  'Meta CAPI uses retry logic',
  fileContains('lib/providers/meta-capi.ts', 'withRetryAndTimeout')
);

test(
  'Meta CAPI checks for missing config',
  fileContains('lib/providers/meta-capi.ts', 'META_PIXEL_ID') &&
  fileContains('lib/providers/meta-capi.ts', 'not configured')
);

// ============================================================================
// TASK 4: Bot/Abuse Hardening
// ============================================================================
console.log(`\n${BOLD}TASK 4: Bot/Abuse Hardening${RESET}\n`);

test(
  'Migration 004 creates suspicious_events table',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'CREATE TABLE IF NOT EXISTS suspicious_events')
);

test(
  'suspicious_events has reason_code field',
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'reason_code TEXT NOT NULL CHECK')
);

test(
  'Security utility exists (lib/security.ts)',
  fileExists('lib/security.ts')
);

test(
  'logSuspiciousEvent function exists',
  fileContains('lib/security.ts', 'export function logSuspiciousEvent')
);

test(
  'Rate limit logs suspicious events',
  fileContains('lib/rate-limit.ts', 'logSuspiciousEvent')
);

test(
  'validateSessionId function exists',
  fileContains('lib/security.ts', 'export function validateSessionId') ||
  fileContains('lib/attribution.ts', 'export function validateSessionId')
);

test(
  'detectSuspiciousPatterns checks for SQL injection',
  fileContains('lib/security.ts', 'sql_injection_attempt')
);

test(
  'detectSuspiciousPatterns checks for XSS',
  fileContains('lib/security.ts', 'xss_attempt')
);

test(
  'Honeypot validation exists',
  fileContains('lib/rate-limit.ts', 'validateHoneypot')
);

test(
  'Timing validation exists',
  fileContains('lib/rate-limit.ts', 'validateRequestTiming') ||
  fileContains('lib/security.ts', 'validateRequestTiming')
);

// ============================================================================
// TASK 5: KPI + Observability
// ============================================================================
console.log(`\n${BOLD}TASK 5: KPI + Observability${RESET}\n`);

test(
  'Metrics endpoint exists (/api/metrics/summary)',
  fileExists('app/api/metrics/summary/route.ts')
);

test(
  'Metrics endpoint protected by secret',
  fileContains('app/api/metrics/summary/route.ts', 'CRON_SECRET') ||
  fileContains('app/api/metrics/summary/route.ts', 'ADMIN_SECRET')
);

test(
  'Metrics endpoint returns leads by source',
  fileContains('app/api/metrics/summary/route.ts', 'leadsBySource') ||
  fileContains('app/api/metrics/summary/route.ts', 'by_source')
);

test(
  'Metrics endpoint returns bookings by campaign',
  fileContains('app/api/metrics/summary/route.ts', 'bookingsBySource') ||
  fileContains('app/api/metrics/summary/route.ts', 'by_campaign')
);

test(
  'Metrics endpoint returns conversion success rate',
  fileContains('app/api/metrics/summary/route.ts', 'success_rate') ||
  fileContains('app/api/metrics/summary/route.ts', 'conversionStats')
);

test(
  'Metrics endpoint returns suspicious events',
  fileContains('app/api/metrics/summary/route.ts', 'suspicious')
);

test(
  'Structured logs in leads route (LEAD_SUBMIT_START)',
  fileContains('app/api/leads/route.ts', 'LEAD_SUBMIT_START')
);

test(
  'Structured logs in bookings route (BOOKING_CREATE_START)',
  fileContains('app/api/bookings/route.ts', 'BOOKING_CREATE_START')
);

test(
  'Structured logs include request_id',
  fileContains('app/api/leads/route.ts', 'requestId') &&
  fileContains('app/api/bookings/route.ts', 'requestId')
);

test(
  'Structured logs include duration_ms',
  fileContains('app/api/leads/route.ts', 'duration_ms') &&
  fileContains('app/api/bookings/route.ts', 'duration_ms')
);

// ============================================================================
// TASK 6: Worker / Cron Processing
// ============================================================================
console.log(`\n${BOLD}TASK 6: Worker / Cron Processing${RESET}\n`);

test(
  'Conversion worker endpoint exists',
  fileExists('app/api/workers/conversions/route.ts')
);

test(
  'Conversion worker fetches pending events',
  fileContains('app/api/workers/conversions/route.ts', "select('*')") &&
  fileContains('app/api/workers/conversions/route.ts', 'status.eq.pending')
);

test(
  'Conversion worker uses atomic claiming',
  fileContains('app/api/workers/conversions/route.ts', "update({") &&
  fileContains('app/api/workers/conversions/route.ts', "status: 'processing'") &&
  fileContains('app/api/workers/conversions/route.ts', "eq('id', event.id)")
);

test(
  'Conversion worker respects max attempts',
  fileContains('app/api/workers/conversions/route.ts', 'MAX_ATTEMPTS')
);

test(
  'Conversion worker respects retry_after',
  fileContains('app/api/workers/conversions/route.ts', 'retry_after')
);

test(
  'Conversion worker calls Google Ads provider',
  fileContains('app/api/workers/conversions/route.ts', 'sendGoogleAdsConversion') ||
  fileContains('app/api/workers/conversions/route.ts', 'processGoogleAdsConversion')
);

test(
  'Conversion worker calls Meta CAPI provider',
  fileContains('app/api/workers/conversions/route.ts', 'sendMetaCapiEvent') ||
  fileContains('app/api/workers/conversions/route.ts', 'processMetaCapiConversion')
);

test(
  'Conversion worker has structured logs',
  fileContains('app/api/workers/conversions/route.ts', 'CONVERSION_WORKER_START') &&
  fileContains('app/api/workers/conversions/route.ts', 'CONVERSION_SEND_SUCCESS')
);

test(
  'Vercel cron configured for conversion worker',
  fileContains('vercel.json', '/api/workers/conversions')
);

test(
  'Conversion worker cron runs every 5 minutes',
  fileContains('vercel.json', '*/5 * * * *')
);

// ============================================================================
// TASK 7: Regression Check (Stage 2-4)
// ============================================================================
console.log(`\n${BOLD}TASK 7: Regression Check (Stage 2-4)${RESET}\n`);

test(
  'RLS still blocks anon SELECT on leads',
  fileContains('supabase/migrations/001_initial_schema_with_rls.sql', 'USING (false)') ||
  fileContains('supabase/migrations/004_stage5_attribution_and_conversions.sql', 'USING (false)')
);

test(
  'Token-based retrieval still exists',
  fileExists('app/api/leads/retrieve/route.ts')
);

test(
  'Rate limiting still exists on /api/leads',
  fileContains('app/api/leads/route.ts', 'rateLimit')
);

test(
  'Idempotency still exists on bookings',
  fileContains('app/api/bookings/route.ts', 'idempotency_key')
);

test(
  'Reminder job queue still exists',
  fileContains('supabase/migrations/003_job_queue_and_idempotency.sql', 'CREATE TABLE IF NOT EXISTS reminder_jobs')
);

test(
  'Email dedupe still exists',
  fileContains('supabase/migrations/003_job_queue_and_idempotency.sql', 'CREATE TABLE IF NOT EXISTS email_sends')
);

test(
  'Retry logic still exists in email',
  fileContains('lib/email.ts', 'withRetryAndTimeout')
);

test(
  'Health endpoint still exists',
  fileExists('app/api/health/route.ts')
);

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n${BOLD}============================================================${RESET}`);
console.log(`${BOLD}Total tests: ${passCount + failCount}${RESET}`);
console.log(`${GREEN}Passed: ${passCount}${RESET}`);
console.log(`${RED}Failed: ${failCount}${RESET}`);
console.log(`${BOLD}============================================================${RESET}\n`);

if (failCount === 0) {
  console.log(`${GREEN}${BOLD}✓ STAGE 5 VERIFICATION COMPLETE - ALL TESTS PASSED${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}✗ STAGE 5 VERIFICATION FAILED - ${failCount} TEST(S) FAILED${RESET}\n`);
  process.exit(1);
}
