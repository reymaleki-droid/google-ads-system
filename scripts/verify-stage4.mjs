#!/usr/bin/env node

/**
 * STAGE 4 VERIFICATION SCRIPT
 * Verifies scalability and ops reliability features without requiring production DB
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result) {
      console.log(`${GREEN}✓${RESET} ${name}`);
      passedTests++;
      return true;
    } else {
      console.log(`${RED}✗${RESET} ${name}`);
      failedTests++;
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name} - ${error.message}`);
    failedTests++;
    return false;
  }
}

function fileExists(path) {
  return existsSync(path);
}

function fileContains(path, pattern) {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, 'utf8');
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  }
  return pattern.test(content);
}

function fileContainsAll(path, patterns) {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, 'utf8');
  return patterns.every(p => {
    if (typeof p === 'string') return content.includes(p);
    return p.test(content);
  });
}

console.log('\n=== STAGE 4 VERIFICATION: Scalability & Ops Reliability ===\n');

// TASK 1: DB-backed job queue
console.log('TASK 1: DB-backed job queue\n');

test('Migration 003 creates reminder_jobs table', () => {
  const path = 'supabase/migrations/003_job_queue_and_idempotency.sql';
  return fileContainsAll(path, [
    'CREATE TABLE IF NOT EXISTS reminder_jobs',
    'id UUID PRIMARY KEY',
    'booking_id UUID NOT NULL REFERENCES bookings',
    'scheduled_for TIMESTAMPTZ NOT NULL',
    'status TEXT NOT NULL',
    'attempts INT NOT NULL DEFAULT 0',
    'last_attempt_at TIMESTAMPTZ',
    'error_message TEXT',
  ]);
});

test('reminder_jobs has index on scheduled_for + status', () => {
  return fileContains(
    'supabase/migrations/003_job_queue_and_idempotency.sql',
    "CREATE INDEX idx_reminder_jobs_scheduled ON reminder_jobs(scheduled_for) WHERE status = 'pending'"
  );
});

test('Worker endpoint exists at /api/workers/reminders', () => {
  return fileExists('app/api/workers/reminders/route.ts');
});

test('Worker fetches due jobs with 5-minute buffer', () => {
  return fileContainsAll('app/api/workers/reminders/route.ts', [
    'const bufferEnd = new Date(now.getTime() + 5 * 60 * 1000)',
    ".lte('scheduled_for', bufferEnd.toISOString())",
  ]);
});

test('Worker uses atomic job claiming (status update)', () => {
  return fileContainsAll('app/api/workers/reminders/route.ts', [
    "status: 'processing'",
    ".eq('id', job.id)",
    ".eq('status', 'pending')",
  ]);
});

test('Worker checks reminder_sent_at for idempotency', () => {
  return fileContainsAll('app/api/workers/reminders/route.ts', [
    'reminder_sent_at',
    'if (booking.reminder_sent_at)',
  ]);
});

test('Booking creation creates reminder job', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    "await serviceSupabase.from('reminder_jobs').insert",
    'booking_id: bookingId',
    'scheduled_for: reminderTime.toISOString()',
  ]);
});

test('Vercel cron configured for every 5 minutes', () => {
  return fileContainsAll('vercel.json', [
    '/api/workers/reminders',
    '"schedule": "*/5 * * * *"',
  ]);
});

// TASK 2: Idempotency
console.log('\nTASK 2: Idempotency\n');

test('Migration adds idempotency_key to bookings', () => {
  return fileContains(
    'supabase/migrations/003_job_queue_and_idempotency.sql',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key TEXT'
  );
});

test('Unique index on bookings.idempotency_key', () => {
  return fileContains(
    'supabase/migrations/003_job_queue_and_idempotency.sql',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency ON bookings(idempotency_key)'
  );
});

test('Booking API accepts idempotency_key', () => {
  return fileContains('app/api/bookings/route.ts', 'idempotency_key');
});

test('Booking API checks for existing booking by idempotency_key', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    'if (idempotency_key)',
    ".eq('idempotency_key', idempotency_key)",
    'Idempotent request - returning existing booking',
  ]);
});

test('Migration creates email_sends table', () => {
  return fileContainsAll('supabase/migrations/003_job_queue_and_idempotency.sql', [
    'CREATE TABLE IF NOT EXISTS email_sends',
    'idempotency_key TEXT NOT NULL UNIQUE',
    'email_type TEXT NOT NULL',
    'booking_id UUID REFERENCES bookings',
  ]);
});

test('Email sending checks email_sends before sending', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    ".from('email_sends')",
    ".eq('idempotency_key', emailIdempotencyKey)",
    'BOOKING_EMAIL_SEND_SKIPPED_DUPLICATE',
  ]);
});

test('Email sending records send in email_sends', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    "await serviceSupabase.from('email_sends').insert",
    'idempotency_key: emailIdempotencyKey',
    "email_type: 'confirmation'",
  ]);
});

// TASK 3: Load resilience
console.log('\nTASK 3: Load resilience\n');

test('Email timeout defined (10s)', () => {
  return fileContains('lib/email.ts', 'const API_TIMEOUT_MS = 10000');
});

test('Email retry count defined (2 retries)', () => {
  return fileContains('lib/email.ts', 'const MAX_RETRIES = 2');
});

test('withRetryAndTimeout function exists', () => {
  return fileContainsAll('lib/email.ts', [
    'async function withRetryAndTimeout',
    'maxAttempts',
    'timeoutMs',
  ]);
});

test('Retry logic uses exponential backoff', () => {
  return fileContains('lib/email.ts', 'const delay = config.delayMs * Math.pow(2, attempt - 1)');
});

test('Retry logic checks retryable errors', () => {
  return fileContainsAll('lib/email.ts', [
    "error.message?.includes('timeout')",
    'error.statusCode === 429',
    'error.statusCode === 503',
    'error.statusCode >= 500',
  ]);
});

test('Email calls wrapped with withRetryAndTimeout', () => {
  return fileContainsAll('lib/email.ts', [
    'await withRetryAndTimeout(() =>',
    'resend.emails.send',
  ]);
});

test('Calendar timeout defined (15s)', () => {
  return fileContains('lib/google.ts', 'const CALENDAR_API_TIMEOUT_MS = 15000');
});

test('Calendar calls wrapped with timeout', () => {
  return fileContainsAll('lib/google.ts', [
    'await withTimeout(',
    'calendar.events.insert',
    'CALENDAR_API_TIMEOUT_MS',
  ]);
});

test('Rate limiting on /api/leads', () => {
  return fileContainsAll('app/api/leads/route.ts', [
    'import { rateLimit',
    'const leadRateLimit = rateLimit',
    'const rateLimitResponse = leadRateLimit(request)',
    'if (rateLimitResponse) return rateLimitResponse',
  ]);
});

test('Rate limiting on /api/bookings', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    'import { rateLimit',
    'const bookingRateLimit = rateLimit',
    'const rateLimitResponse = bookingRateLimit(request)',
  ]);
});

test('Rate limiting on /api/slots', () => {
  return fileContainsAll('app/api/slots/route.ts', [
    'import { rateLimit',
    'const slotsRateLimit = rateLimit',
  ]);
});

test('Rate limiting on /api/leads/retrieve', () => {
  return fileContainsAll('app/api/leads/retrieve/route.ts', [
    'import { rateLimit',
    'const retrieveRateLimit = rateLimit',
  ]);
});

test('Rate limit returns 429 with Retry-After header', () => {
  return fileContainsAll('lib/rate-limit.ts', [
    'status: 429',
    "'Retry-After': retryAfter.toString()",
    "'X-RateLimit-Limit'",
    "'X-RateLimit-Remaining'",
  ]);
});

// TASK 4: Observability
console.log('\nTASK 4: Observability\n');

test('Structured logs: BOOKING_EMAIL_SEND_START', () => {
  return fileContains('app/api/bookings/route.ts', "console.log('BOOKING_EMAIL_SEND_START'");
});

test('Structured logs: BOOKING_EMAIL_SEND_SUCCESS', () => {
  return fileContains('app/api/bookings/route.ts', "console.log('BOOKING_EMAIL_SEND_SUCCESS'");
});

test('Structured logs: BOOKING_EMAIL_SEND_FAILED', () => {
  return fileContains('app/api/bookings/route.ts', "console.error('BOOKING_EMAIL_SEND_FAILED'");
});

test('Structured logs: REMINDER_WORKER_START', () => {
  return fileContains('app/api/workers/reminders/route.ts', "console.log('REMINDER_WORKER_START'");
});

test('Structured logs: REMINDER_WORKER_COMPLETE', () => {
  return fileContains('app/api/workers/reminders/route.ts', "console.log('REMINDER_WORKER_COMPLETE'");
});

test('Structured logs: REMINDER_WORKER_EMAIL_SEND_SUCCESS', () => {
  return fileContains('app/api/workers/reminders/route.ts', "console.log('REMINDER_WORKER_EMAIL_SEND_SUCCESS'");
});

test('Logs include booking_id field', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    'bookingId',
  ]) && fileContainsAll('app/api/workers/reminders/route.ts', [
    'bookingId: booking.id',
  ]);
});

test('Logs include duration_ms field', () => {
  return fileContainsAll('app/api/workers/reminders/route.ts', [
    'duration_ms: duration',
  ]);
});

test('Logs classify errors as retryable', () => {
  return fileContainsAll('app/api/bookings/route.ts', [
    'retryable: true',
    'retryable: false',
  ]) || fileContainsAll('app/api/workers/reminders/route.ts', [
    'retryable:',
  ]);
});

test('/api/health endpoint exists', () => {
  return fileExists('app/api/health/route.ts');
});

test('/api/health checks Supabase connectivity', () => {
  return fileContainsAll('app/api/health/route.ts', [
    'const supabase = createClient',
    "await supabase.from('leads').select('id').limit(1)",
    "health.checks.supabase = error ? 'unhealthy' : 'healthy'",
  ]);
});

test('/api/health checks Resend configuration', () => {
  return fileContainsAll('app/api/health/route.ts', [
    'process.env.RESEND_API_KEY',
    "health.checks.resend",
  ]);
});

test('/api/health returns 503 when unhealthy', () => {
  return fileContains('app/api/health/route.ts', 'status: 503');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Total tests: ${totalTests}`);
console.log(`${GREEN}Passed: ${passedTests}${RESET}`);
console.log(`${RED}Failed: ${failedTests}${RESET}`);

if (failedTests === 0) {
  console.log(`\n${GREEN}✓ STAGE 4 VERIFICATION COMPLETE - ALL TESTS PASSED${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}✗ STAGE 4 VERIFICATION FAILED - ${failedTests} tests failed${RESET}\n`);
  process.exit(1);
}
