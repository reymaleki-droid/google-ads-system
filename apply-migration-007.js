#!/usr/bin/env node
/**
 * Apply Database Migration Script
 * Applies the 007_customer_google_ads.sql migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '007_customer_google_ads.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  console.log('📦 Applying migration: 007_customer_google_ads.sql');
  console.log('');

  try {
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comment-only statements
      if (statement.trim().startsWith('--')) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Check if error is just "table already exists" - that's okay
          if (error.message && error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} statements`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('customer_google_ads_accounts')
      .select('*')
      .limit(0);

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('');
        console.log('⚠️  Table not created via API. Using alternative method...');
        console.log('');
        console.log('📋 MANUAL MIGRATION REQUIRED:');
        console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Create a new query');
        console.log('5. Copy the contents of: supabase/migrations/007_customer_google_ads.sql');
        console.log('6. Paste and execute');
        console.log('');
      } else {
        console.error('❌ Error verifying table:', tableError.message);
      }
    } else {
      console.log('✅ Table customer_google_ads_accounts exists and is accessible');
      console.log('');
      console.log('🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('📋 MANUAL MIGRATION REQUIRED:');
    console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query');
    console.log('5. Copy the contents of: supabase/migrations/007_customer_google_ads.sql');
    console.log('6. Paste and execute');
    process.exit(1);
  }
}

// Run migration
applyMigration();
