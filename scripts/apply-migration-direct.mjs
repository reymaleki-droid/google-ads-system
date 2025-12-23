#!/usr/bin/env node
/**
 * Direct PostgreSQL Migration Application
 * Uses pg library to connect directly to Supabase PostgreSQL
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function main() {
  log('\n' + '='.repeat(70), 'blue');
  log('  DIRECT POSTGRESQL MIGRATION APPLICATION', 'bright');
  log('='.repeat(70) + '\n', 'blue');

  // Parse Supabase connection string
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL not set', 'red');
    process.exit(1);
  }

  // Extract project ref from URL: https://PROJECT_REF.supabase.co
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    log('❌ Cannot extract project ref from Supabase URL', 'red');
    process.exit(1);
  }

  log('✓ Project ref:', 'green');
  log(`  ${projectRef}`, 'gray');

  // Build connection string
  // Supabase format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!dbPassword) {
    log('\n⚠️  Database password not found', 'yellow');
    log('   Supabase requires database password for direct PostgreSQL access', 'gray');
    log('\n📋 To enable direct database access:', 'blue');
    log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database', 'yellow');
    log('   2. Find "Connection string" section', 'yellow');
    log('   3. Copy the password and add to .env.local:', 'yellow');
    log('      SUPABASE_DB_PASSWORD=your_password', 'yellow');
    log('\n   OR use the manual SQL Editor method (30 seconds):', 'gray');
    log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new', 'yellow');
    log('   2. Copy: supabase/APPLY_OTP_MIGRATION_NOW.sql', 'yellow');
    log('   3. Paste and click "Run"\n', 'yellow');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  log('✓ Connection string built', 'green');
  log(`  postgres.${projectRef}@aws-0-us-east-1.pooler.supabase.com`, 'gray');

  // Connect
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    log('\n⏳ Connecting to PostgreSQL...', 'yellow');
    await client.connect();
    log('✓ Connected successfully!', 'green');
  } catch (error) {
    log('❌ Connection failed:', 'red');
    log(`   ${error.message}`, 'yellow');
    log('\n   This usually means:', 'gray');
    log('   - Wrong database password', 'gray');
    log('   - Connection pooler not enabled', 'gray');
    log('   - Firewall blocking connection', 'gray');
    log('\n📋 Recommended: Use SQL Editor method (simpler)', 'blue');
    log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n', 'yellow');
    process.exit(1);
  }

  // Read SQL
  const sqlPath = join(__dirname, '..', 'supabase', 'APPLY_OTP_MIGRATION_NOW.sql');
  const sqlContent = readFileSync(sqlPath, 'utf-8');
  
  log('✓ Migration SQL loaded', 'green');

  // Execute
  try {
    log('\n⏳ Executing migration...', 'yellow');
    await client.query(sqlContent);
    log('✓ Migration executed successfully!', 'green');
  } catch (error) {
    log('❌ Execution failed:', 'red');
    log(`   ${error.message}`, 'yellow');
    await client.end();
    process.exit(1);
  }

  // Verify
  log('\n⏳ Verifying migration...', 'yellow');
  
  try {
    await client.query('SELECT 1 FROM phone_verifications LIMIT 1');
    log('✓ phone_verifications table exists', 'green');
  } catch (error) {
    if (error.code === '42P01') {
      log('✗ phone_verifications table missing', 'red');
    }
  }

  try {
    await client.query('SELECT phone_verified_at FROM leads LIMIT 1');
    log('✓ leads.phone_verified_at column exists', 'green');
  } catch (error) {
    if (error.code === '42703') {
      log('✗ leads.phone_verified_at column missing', 'red');
    }
  }

  await client.end();

  log('\n' + '='.repeat(70), 'green');
  log('  🎉 OTP MIGRATION COMPLETE!', 'bright');
  log('='.repeat(70), 'green');
  log('\nTest the OTP flow:', 'blue');
  log('  npm run dev', 'gray');
  log('  Open: http://localhost:3000/free-audit', 'gray');
  log('  Submit form → Test OTP verification\n', 'gray');
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
