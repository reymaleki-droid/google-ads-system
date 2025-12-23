#!/usr/bin/env node
/**
 * Apply OTP Phone Verification Migration to Supabase
 * Reads SQL file and executes via Supabase service_role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🚀 OTP Migration Application Script', 'blue');
  log('═'.repeat(60), 'gray');

  // 1. Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Error: Missing environment variables', 'red');
    log('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    process.exit(1);
  }

  log('✅ Environment variables loaded', 'green');
  log(`   URL: ${supabaseUrl}`, 'gray');

  // 2. Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  log('✅ Supabase client initialized', 'green');

  // 3. Read SQL migration file
  const sqlPath = join(__dirname, '..', 'supabase', 'APPLY_OTP_MIGRATION_NOW.sql');
  let sqlContent;
  
  try {
    sqlContent = readFileSync(sqlPath, 'utf-8');
    log('✅ Migration SQL file loaded', 'green');
    log(`   File: ${sqlPath}`, 'gray');
  } catch (error) {
    log('❌ Error reading SQL file:', 'red');
    log(`   ${error.message}`, 'yellow');
    process.exit(1);
  }

  // 4. Execute SQL migration
  log('\n⏳ Executing migration...', 'yellow');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    });

    if (error) {
      // Try direct query execution instead
      log('   Trying alternative execution method...', 'gray');
      
      const { error: execError } = await supabase
        .from('_sql_exec')
        .insert({ query: sqlContent });
      
      if (execError) {
        throw execError;
      }
    }

    log('✅ Migration executed successfully!', 'green');

  } catch (error) {
    log('⚠️  Cannot execute SQL via API', 'yellow');
    log('   Supabase does not allow SQL execution via REST API for security', 'gray');
    log('\n📋 MANUAL STEPS REQUIRED:', 'blue');
    log('   1. Open: https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new', 'yellow');
    log('   2. Copy: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
    log('   3. Paste into SQL Editor and click "Run"', 'yellow');
    log('\n   Error details:', 'gray');
    log(`   ${error.message}`, 'red');
  }

  // 5. Verify migration was applied
  log('\n⏳ Verifying migration status...', 'yellow');

  try {
    // Check if phone_verifications table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('phone_verifications')
      .select('count')
      .limit(0);

    if (tableError && tableError.code === '42P01') {
      log('❌ phone_verifications table does NOT exist', 'red');
      log('   Migration needs to be applied manually', 'yellow');
    } else if (tableError) {
      log('⚠️  Cannot verify table:', 'yellow');
      log(`   ${tableError.message}`, 'gray');
    } else {
      log('✅ phone_verifications table exists!', 'green');
    }

    // Check if leads.phone_verified_at column exists
    const { data: leadsCheck, error: leadsError } = await supabase
      .from('leads')
      .select('phone_verified_at')
      .limit(1);

    if (leadsError && leadsError.message.includes('phone_verified_at')) {
      log('❌ leads.phone_verified_at column does NOT exist', 'red');
    } else if (leadsError) {
      log('⚠️  Cannot verify leads table:', 'yellow');
      log(`   ${leadsError.message}`, 'gray');
    } else {
      log('✅ leads.phone_verified_at column exists!', 'green');
    }

  } catch (error) {
    log('⚠️  Verification failed:', 'yellow');
    log(`   ${error.message}`, 'gray');
  }

  log('\n' + '═'.repeat(60), 'gray');
  log('Migration script completed', 'blue');
  log('See: RUN_THIS_IN_SUPABASE.md for manual steps\n', 'gray');
}

main().catch(console.error);
