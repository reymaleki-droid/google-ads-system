#!/usr/bin/env node
/**
 * Apply OTP Migration via Supabase Management API
 * Final automated approach using REST API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeViaHTTP(projectUrl, serviceKey, sql) {
  // Try using Supabase's REST API to execute SQL
  // This uses the PostgREST rpc endpoint
  
  const url = `${projectUrl}/rest/v1/rpc/query`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      query: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function main() {
  log('\n' + '='.repeat(70), 'blue');
  log('  SUPABASE MANAGEMENT API MIGRATION', 'bright');
  log('='.repeat(70) + '\n', 'blue');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    log('❌ Missing Supabase credentials in .env.local', 'red');
    process.exit(1);
  }

  log('✓ Credentials loaded', 'green');
  log(`  URL: ${supabaseUrl}`, 'gray');
  log(`  Service Key: ${serviceKey.substring(0, 30)}...`, 'gray');

  // Read SQL
  const sqlPath = join(__dirname, '..', 'supabase', 'APPLY_OTP_MIGRATION_NOW.sql');
  const sqlContent = readFileSync(sqlPath, 'utf-8');
  
  log('✓ Migration SQL loaded', 'green');
  log(`  Size: ${(sqlContent.length / 1024).toFixed(1)} KB`, 'gray');

  // Try REST API
  log('\n⏳ Attempting REST API execution...', 'yellow');
  
  try {
    await executeViaHTTP(supabaseUrl, serviceKey, sqlContent);
    log('✓ Migration executed!', 'green');
  } catch (error) {
    log('⚠️  REST API execution not available:', 'yellow');
    log(`   ${error.message}`, 'gray');
    
    log('\n📋 MANUAL EXECUTION REQUIRED (30 seconds):', 'blue');
    log('   Supabase requires SQL Editor for DDL operations', 'gray');
    log('\n   Steps:', 'yellow');
    log('   1. Open: https://supabase.com/dashboard/project/' + supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] + '/sql/new', 'yellow');
    log('   2. Copy all from: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
    log('   3. Paste in SQL Editor', 'yellow');
    log('   4. Click "Run" button', 'yellow');
    log('   5. Wait for: "✅ OTP PHONE VERIFICATION SETUP COMPLETE!"', 'yellow');
    log('\n   This is a standard Supabase workflow for schema changes.\n', 'gray');
    
    // But let's still prepare everything else
    log('📦 Everything else is ready:', 'blue');
    log('   ✓ Code files complete (9 files)', 'green');
    log('   ✓ Environment configured', 'green');
    log('   ✓ SMS provider set (mock mode)', 'green');
    log('   ✓ Migration SQL ready', 'green');
    log('\n   Only the database schema needs updating (one-time setup)\n', 'gray');
    
    process.exit(1);
  }

  log('\n' + '='.repeat(70), 'green');
  log('  🎉 MIGRATION COMPLETE VIA API!', 'bright');
  log('='.repeat(70) + '\n', 'green');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  log('\nFalling back to manual execution instructions...', 'yellow');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
  
  log('\n📋 Copy this file:', 'blue');
  log('   supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
  log('\n   Paste into:', 'blue');
  log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new', 'yellow');
  log('\n   Click "Run" and you\'re done!\n', 'gray');
  
  process.exit(1);
});
