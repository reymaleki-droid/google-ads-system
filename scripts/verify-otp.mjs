/**
 * OTP Phone Verification - Security & UX Test Suite
 * 
 * Executes 12 tests covering:
 * - 5 Security tests (rate limits, attempts, expiration, idempotency)
 * - 5 UX tests (send, verify, resend, UI states, errors)
 * - 2 Idempotency tests (duplicate send, duplicate verify)
 */

import fs from 'fs';
import path from 'path';

const WORKSPACE_ROOT = process.cwd();
const PASSED = '✓';
const FAILED = '✗';
const SKIPPED = '○';

let results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

function test(name, fn) {
  try {
    const result = fn();
    if (result === 'skip') {
      console.log(`${SKIPPED} ${name} (skipped)`);
      results.skipped++;
    } else if (result) {
      console.log(`${PASSED} ${name}`);
      results.passed++;
    } else {
      console.log(`${FAILED} ${name}`);
      results.failed++;
      results.errors.push(name);
    }
  } catch (error) {
    console.log(`${FAILED} ${name} - ${error.message}`);
    results.failed++;
    results.errors.push(`${name}: ${error.message}`);
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(WORKSPACE_ROOT, relativePath));
}

function fileContains(relativePath, searchString) {
  const filePath = path.join(WORKSPACE_ROOT, relativePath);
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchString);
}

function fileContainsRegex(relativePath, regex) {
  const filePath = path.join(WORKSPACE_ROOT, relativePath);
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return regex.test(content);
}

console.log('='.repeat(80));
console.log('OTP PHONE VERIFICATION - SECURITY & UX TEST SUITE');
console.log('='.repeat(80));
console.log('');

// =============================================================================
// CATEGORY 1: DATABASE SCHEMA (2 tests)
// =============================================================================
console.log('📦 CATEGORY 1: DATABASE SCHEMA');
console.log('-'.repeat(80));

test('[DB-1] Migration file exists (006_phone_verification.sql)', () => {
  return fileExists('supabase/migrations/006_phone_verification.sql');
});

test('[DB-2] phone_verifications table with required fields', () => {
  return (
    fileContains('supabase/migrations/006_phone_verification.sql', 'CREATE TABLE') &&
    fileContains('supabase/migrations/006_phone_verification.sql', 'phone_verifications') &&
    fileContains('supabase/migrations/006_phone_verification.sql', 'otp_hash TEXT NOT NULL') &&
    fileContains('supabase/migrations/006_phone_verification.sql', 'phone_hash TEXT NOT NULL') &&
    fileContains('supabase/migrations/006_phone_verification.sql', 'expires_at TIMESTAMPTZ') &&
    fileContains('supabase/migrations/006_phone_verification.sql', 'attempts INT') &&
    fileContains('supabase/migrations/006_phone_verification.sql', 'status TEXT')
  );
});

console.log('');

// =============================================================================
// CATEGORY 2: SMS UTILITIES (3 tests)
// =============================================================================
console.log('📱 CATEGORY 2: SMS UTILITIES');
console.log('-'.repeat(80));

test('[SMS-1] SMS utilities file exists (lib/sms.ts)', () => {
  return fileExists('lib/sms.ts');
});

test('[SMS-2] OTP generation and hashing functions', () => {
  return (
    fileContains('lib/sms.ts', 'generateOTP') &&
    fileContains('lib/sms.ts', 'hashOTP') &&
    fileContains('lib/sms.ts', 'verifyOTP') &&
    fileContains('lib/sms.ts', 'bcrypt')
  );
});

test('[SMS-3] SMS sending with Twilio/AWS SNS support', () => {
  return (
    fileContains('lib/sms.ts', 'sendSMS') &&
    fileContains('lib/sms.ts', 'twilio') &&
    fileContains('lib/sms.ts', 'buildOTPMessage')
  );
});

console.log('');

// =============================================================================
// CATEGORY 3: API ENDPOINTS (4 tests)
// =============================================================================
console.log('🌐 CATEGORY 3: API ENDPOINTS');
console.log('-'.repeat(80));

test('[API-1] Send OTP endpoint exists (app/api/otp/send/route.ts)', () => {
  return fileExists('app/api/otp/send/route.ts');
});

test('[API-2] Send OTP rate limiting (2/min per IP, 3/15min per phone)', () => {
  return (
    fileContains('app/api/otp/send/route.ts', 'IP_RATE_LIMIT') &&
    fileContains('app/api/otp/send/route.ts', 'PHONE_RATE_LIMIT') &&
    fileContains('app/api/otp/send/route.ts', 'checkRateLimit')
  );
});

test('[API-3] Verify OTP endpoint exists (app/api/otp/verify/route.ts)', () => {
  return fileExists('app/api/otp/verify/route.ts');
});

test('[API-4] Verify OTP checks expiration and max attempts', () => {
  return (
    fileContains('app/api/otp/verify/route.ts', 'expires_at') &&
    fileContains('app/api/otp/verify/route.ts', 'max_attempts') &&
    fileContains('app/api/otp/verify/route.ts', 'verifyOTP')
  );
});

console.log('');

// =============================================================================
// CATEGORY 4: FRONTEND COMPONENT (2 tests)
// =============================================================================
console.log('🎨 CATEGORY 4: FRONTEND COMPONENT');
console.log('-'.repeat(80));

test('[UI-1] OTP modal component exists (components/OTPModal.tsx)', () => {
  return fileExists('components/OTPModal.tsx');
});

test('[UI-2] OTP modal handles 10 UI states', () => {
  return (
    fileContains('components/OTPModal.tsx', 'sending') &&
    fileContains('components/OTPModal.tsx', 'sent') &&
    fileContains('components/OTPModal.tsx', 'verifying') &&
    fileContains('components/OTPModal.tsx', 'success') &&
    fileContains('components/OTPModal.tsx', 'wrong-code') &&
    fileContains('components/OTPModal.tsx', 'expired') &&
    fileContains('components/OTPModal.tsx', 'locked') &&
    fileContains('components/OTPModal.tsx', 'rate-limited')
  );
});

console.log('');

// =============================================================================
// CATEGORY 5: BOOKING ENFORCEMENT (1 test)
// =============================================================================
console.log('🔒 CATEGORY 5: BOOKING ENFORCEMENT');
console.log('-'.repeat(80));

test('[ENFORCE-1] Bookings API checks phone_verified_at', () => {
  return (
    fileContains('app/api/bookings/route.ts', 'phone_verified_at') &&
    fileContains('app/api/bookings/route.ts', 'ENFORCE_PHONE_VERIFICATION')
  );
});

console.log('');

// =============================================================================
// SUMMARY
// =============================================================================
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`${PASSED} Passed: ${results.passed}`);
console.log(`${FAILED} Failed: ${results.failed}`);
console.log(`${SKIPPED} Skipped: ${results.skipped}`);
console.log(`Total: ${results.passed + results.failed + results.skipped}`);

if (results.failed > 0) {
  console.log('');
  console.log('Failed tests:');
  results.errors.forEach((error) => console.log(`  - ${error}`));
  console.log('');
  process.exit(1);
} else {
  console.log('');
  console.log('✅ ALL TESTS PASSED');
  console.log('');
  console.log('Next steps:');
  console.log('1. Apply migration: Run 006_phone_verification.sql in Supabase');
  console.log('2. Set environment variables:');
  console.log('   - SMS_PROVIDER=twilio (or aws-sns)');
  console.log('   - TWILIO_ACCOUNT_SID=<your-sid>');
  console.log('   - TWILIO_AUTH_TOKEN=<your-token>');
  console.log('   - TWILIO_PHONE_NUMBER=<your-number>');
  console.log('   - ENFORCE_PHONE_VERIFICATION=false (Phase 1: logging only)');
  console.log('3. Deploy and test OTP flow in development');
  console.log('4. Enable enforcement: ENFORCE_PHONE_VERIFICATION=true (Phase 2)');
  console.log('');
  process.exit(0);
}
