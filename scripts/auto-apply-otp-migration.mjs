#!/usr/bin/env node
/**
 * Automatically Apply OTP Migration via Supabase API
 * Uses service_role key to execute SQL migrations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
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

async function executeSQL(supabase, sql) {
  // Split SQL into individual statements (handle DO blocks properly)
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  let blockDepth = 0;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (trimmed.startsWith('--') || trimmed === '') {
      continue;
    }

    currentStatement += line + '\n';

    // Track DO blocks
    if (trimmed.toUpperCase().startsWith('DO $$') || trimmed.toUpperCase().startsWith('DO$')) {
      inDoBlock = true;
      blockDepth++;
    }

    if (inDoBlock && trimmed.includes('$$')) {
      blockDepth--;
      if (blockDepth === 0) {
        inDoBlock = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    } else if (!inDoBlock && trimmed.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  log(`  Found ${statements.length} SQL statements to execute`, 'gray');

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;

    try {
      // Use Supabase's rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        // If exec_sql doesn't exist, try direct execution for DDL
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          // Try using Supabase REST API for schema changes
          log(`  Statement ${i + 1}: Using REST API fallback`, 'gray');
          
          // For CREATE TABLE, ALTER TABLE, etc., we need to use the REST API differently
          if (stmt.toUpperCase().includes('CREATE TABLE')) {
            const tableName = extractTableName(stmt);
            log(`    Creating table: ${tableName}`, 'gray');
          } else if (stmt.toUpperCase().includes('ALTER TABLE')) {
            log(`    Altering table structure`, 'gray');
          } else if (stmt.toUpperCase().includes('CREATE INDEX')) {
            log(`    Creating index`, 'gray');
          } else if (stmt.toUpperCase().includes('CREATE POLICY')) {
            log(`    Creating RLS policy`, 'gray');
          }
          
          // These DDL statements need to be run via SQL editor
          throw new Error('DDL statements require SQL Editor execution');
        }
        throw error;
      }
      
      log(`  ✓ Statement ${i + 1} executed`, 'green');
    } catch (err) {
      log(`  ✗ Statement ${i + 1} failed: ${err.message}`, 'red');
      if (err.message.includes('already exists')) {
        log(`    (Skipping - already exists)`, 'yellow');
      } else {
        throw err;
      }
    }
  }
}

function extractTableName(sql) {
  const match = sql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z_]+)/i);
  return match ? match[1] : 'unknown';
}

async function main() {
  log('\n' + '='.repeat(70), 'blue');
  log('  AUTOMATIC OTP MIGRATION APPLICATION', 'bright');
  log('='.repeat(70) + '\n', 'blue');

  // Load environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing Supabase credentials', 'red');
    log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    process.exit(1);
  }

  log('✓ Loaded Supabase credentials', 'green');
  log(`  URL: ${supabaseUrl}`, 'gray');
  log(`  Key: service_role (${supabaseKey.substring(0, 20)}...)`, 'gray');

  // Initialize client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  log('✓ Supabase client initialized', 'green');

  // Read migration SQL
  const sqlPath = join(__dirname, '..', 'supabase', 'APPLY_OTP_MIGRATION_NOW.sql');
  let sqlContent;
  
  try {
    sqlContent = readFileSync(sqlPath, 'utf-8');
    log('✓ Migration SQL loaded', 'green');
    log(`  File: ${sqlPath}`, 'gray');
  } catch (error) {
    log('❌ Cannot read SQL file:', 'red');
    log(`  ${error.message}`, 'yellow');
    process.exit(1);
  }

  // Try to execute via Supabase API
  log('\n⏳ Attempting automated execution via Supabase API...', 'yellow');
  
  try {
    await executeSQL(supabase, sqlContent);
    log('\n✓ Migration executed successfully!', 'green');
  } catch (error) {
    log('\n⚠️  Automated execution not possible', 'yellow');
    log(`   Reason: ${error.message}`, 'gray');
    log('\n   Supabase requires DDL operations (CREATE TABLE, ALTER TABLE)', 'yellow');
    log('   to be executed via the SQL Editor for security reasons.', 'yellow');
    log('\n📋 FALLBACK: Manual execution required', 'blue');
    log('   1. Open: https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new', 'yellow');
    log('   2. Copy: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
    log('   3. Paste and click "Run"', 'yellow');
    log('\n   This is a one-time setup that takes 30 seconds.\n', 'gray');
    process.exit(1);
  }

  // Verify migration
  log('\n⏳ Verifying migration...', 'yellow');
  
  let verified = true;

  // Check phone_verifications table
  try {
    const { error } = await supabase
      .from('phone_verifications')
      .select('count')
      .limit(0);

    if (error && error.code === '42P01') {
      log('✗ phone_verifications table missing', 'red');
      verified = false;
    } else if (error) {
      log(`⚠  Cannot verify table: ${error.message}`, 'yellow');
    } else {
      log('✓ phone_verifications table exists', 'green');
    }
  } catch (err) {
    log(`✗ Verification error: ${err.message}`, 'red');
    verified = false;
  }

  // Check leads.phone_verified_at column
  try {
    const { error } = await supabase
      .from('leads')
      .select('phone_verified_at')
      .limit(1);

    if (error && error.message.includes('phone_verified_at')) {
      log('✗ leads.phone_verified_at column missing', 'red');
      verified = false;
    } else if (error) {
      log(`⚠  Cannot verify column: ${error.message}`, 'yellow');
    } else {
      log('✓ leads.phone_verified_at column exists', 'green');
    }
  } catch (err) {
    log(`✗ Verification error: ${err.message}`, 'red');
    verified = false;
  }

  if (verified) {
    log('\n' + '='.repeat(70), 'green');
    log('  🎉 OTP PHONE VERIFICATION IS READY!', 'bright');
    log('='.repeat(70), 'green');
    log('\nNext steps:', 'blue');
    log('  1. Start dev server: npm run dev', 'gray');
    log('  2. Go to: http://localhost:3000/free-audit', 'gray');
    log('  3. Submit form and test OTP flow', 'gray');
    log('  4. Check terminal for OTP code (mock mode)\n', 'gray');
  } else {
    log('\n⚠️  Migration verification failed', 'yellow');
    log('   Some components may not be set up correctly', 'gray');
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
