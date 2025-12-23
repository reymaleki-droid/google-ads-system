#!/usr/bin/env node
/**
 * Verify OTP Phone Verification Setup
 * Checks if migration was applied and system is ready
 */

import { createClient } from '@supabase/supabase-js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n' + '═'.repeat(70), 'blue');
  log('  OTP PHONE VERIFICATION - SETUP VERIFICATION', 'bold');
  log('═'.repeat(70) + '\n', 'blue');

  // Load environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const enforceVerification = process.env.ENFORCE_PHONE_VERIFICATION;
  const smsProvider = process.env.SMS_PROVIDER;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ FAILED: Missing Supabase credentials', 'red');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let score = 0;
  const checks = [];

  // Check 1: Environment variables
  log('📋 Checking Environment Variables...', 'blue');
  if (enforceVerification === 'true') {
    log('  ✅ ENFORCE_PHONE_VERIFICATION=true (OTP required)', 'green');
    checks.push({ name: 'Enforcement enabled', pass: true });
    score++;
  } else {
    log('  ⚠️  ENFORCE_PHONE_VERIFICATION not set (OTP optional)', 'yellow');
    checks.push({ name: 'Enforcement enabled', pass: false });
  }

  if (smsProvider) {
    log(`  ✅ SMS_PROVIDER=${smsProvider}`, 'green');
    checks.push({ name: 'SMS provider configured', pass: true });
    score++;
  } else {
    log('  ❌ SMS_PROVIDER not set', 'red');
    checks.push({ name: 'SMS provider configured', pass: false });
  }

  // Check 2: Database table
  log('\n📋 Checking Database Tables...', 'blue');
  try {
    const { data, error } = await supabase
      .from('phone_verifications')
      .select('count')
      .limit(0);

    if (error && error.code === '42P01') {
      log('  ❌ phone_verifications table does NOT exist', 'red');
      log('     Run: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
      checks.push({ name: 'phone_verifications table', pass: false });
    } else if (error) {
      log(`  ⚠️  Error checking table: ${error.message}`, 'yellow');
      checks.push({ name: 'phone_verifications table', pass: false });
    } else {
      log('  ✅ phone_verifications table exists', 'green');
      checks.push({ name: 'phone_verifications table', pass: true });
      score++;
    }
  } catch (err) {
    log(`  ❌ Cannot connect to database: ${err.message}`, 'red');
    checks.push({ name: 'phone_verifications table', pass: false });
  }

  // Check 3: Column in leads table
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('phone_verified_at')
      .limit(1);

    if (error && error.message.includes('phone_verified_at')) {
      log('  ❌ leads.phone_verified_at column does NOT exist', 'red');
      checks.push({ name: 'leads.phone_verified_at column', pass: false });
    } else if (error) {
      log(`  ⚠️  Error checking column: ${error.message}`, 'yellow');
      checks.push({ name: 'leads.phone_verified_at column', pass: false });
    } else {
      log('  ✅ leads.phone_verified_at column exists', 'green');
      checks.push({ name: 'leads.phone_verified_at column', pass: true });
      score++;
    }
  } catch (err) {
    log(`  ❌ Cannot check leads table: ${err.message}`, 'red');
    checks.push({ name: 'leads.phone_verified_at column', pass: false });
  }

  // Check 4: API endpoints exist
  log('\n📋 Checking API Endpoints...', 'blue');
  const endpoints = [
    { path: 'app/api/otp/send/route.ts', name: 'Send OTP endpoint' },
    { path: 'app/api/otp/verify/route.ts', name: 'Verify OTP endpoint' },
  ];

  const fs = await import('fs');
  for (const endpoint of endpoints) {
    if (fs.existsSync(endpoint.path)) {
      log(`  ✅ ${endpoint.name} exists`, 'green');
      checks.push({ name: endpoint.name, pass: true });
      score++;
    } else {
      log(`  ❌ ${endpoint.name} NOT found`, 'red');
      checks.push({ name: endpoint.name, pass: false });
    }
  }

  // Check 5: Frontend component
  log('\n📋 Checking Frontend Components...', 'blue');
  if (fs.existsSync('components/OTPModal.tsx')) {
    log('  ✅ OTPModal component exists', 'green');
    checks.push({ name: 'OTPModal component', pass: true });
    score++;
  } else {
    log('  ❌ OTPModal component NOT found', 'red');
    checks.push({ name: 'OTPModal component', pass: false });
  }

  // Final report
  const maxScore = checks.length;
  const percentage = Math.round((score / maxScore) * 100);

  log('\n' + '═'.repeat(70), 'blue');
  log('  VERIFICATION SUMMARY', 'bold');
  log('═'.repeat(70), 'blue');
  
  log(`\n  Score: ${score}/${maxScore} (${percentage}%)`, percentage === 100 ? 'green' : 'yellow');
  
  if (percentage === 100) {
    log('\n  🎉 OTP PHONE VERIFICATION IS READY!', 'green');
    log('\n  Next steps:', 'blue');
    log('    1. Start dev server: npm run dev', 'gray');
    log('    2. Test at: http://localhost:3000/free-audit', 'gray');
    log('    3. Check terminal for OTP code (mock mode)', 'gray');
  } else if (percentage >= 70) {
    log('\n  ⚠️  OTP system is PARTIALLY set up', 'yellow');
    log('\n  Issues:', 'blue');
    checks.filter(c => !c.pass).forEach(c => {
      log(`    ❌ ${c.name}`, 'red');
    });
    log('\n  Fix by running: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
  } else {
    log('\n  ❌ OTP system is NOT set up', 'red');
    log('\n  Required actions:', 'blue');
    log('    1. Run SQL migration: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
    log('    2. Set ENFORCE_PHONE_VERIFICATION=true in .env.local', 'yellow');
    log('    3. Configure SMS_PROVIDER in .env.local', 'yellow');
  }

  log('\n' + '═'.repeat(70) + '\n', 'blue');
}

main().catch(console.error);
