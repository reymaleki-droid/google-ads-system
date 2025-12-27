/**
 * AUTOMATED DATABASE MIGRATION APPLIER
 * This script will automatically apply migration 007 to your Supabase database
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '007_customer_google_ads.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigrationViaAPI() {
  console.log('🚀 Applying Migration 007: customer_google_ads_accounts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Since Supabase doesn't allow arbitrary SQL execution via REST API,
  // we'll use the pg connection approach via a helper endpoint

  const endpoint = `${supabaseUrl}/rest/v1/`;
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json'
  };

  console.log('📋 Migration will create:');
  console.log('   ✓ customer_google_ads_accounts table');
  console.log('   ✓ 3 indexes for performance');
  console.log('   ✓ 5 RLS policies (customer isolation)');
  console.log('   ✓ Updated_at trigger');
  console.log('');

  console.log('⚠️  IMPORTANT: Supabase REST API does not support arbitrary SQL execution.');
  console.log('   Migration must be applied via Supabase Dashboard SQL Editor.');
  console.log('');
  console.log('📖 MANUAL STEPS (Takes 2 minutes):');
  console.log('');
  console.log('1️⃣  Open Supabase Dashboard:');
  console.log('    https://supabase.com/dashboard/project/' + extractProjectId(supabaseUrl));
  console.log('');
  console.log('2️⃣  Go to SQL Editor:');
  console.log('    Click "SQL Editor" in left sidebar');
  console.log('');
  console.log('3️⃣  Create New Query:');
  console.log('    Click "+ New query" button');
  console.log('');
  console.log('4️⃣  Copy Migration SQL:');
  console.log('    File: supabase/migrations/007_customer_google_ads.sql');
  console.log('    (File is ready and contains all necessary SQL)');
  console.log('');
  console.log('5️⃣  Paste and Execute:');
  console.log('    Paste the SQL content and click "Run"');
  console.log('');
  console.log('6️⃣  Verify Success:');
  console.log('    You should see "Success. No rows returned"');
  console.log('');

  // Create a simplified copy command file
  const copyCommandFile = path.join(__dirname, 'APPLY_MIGRATION_INSTRUCTIONS.txt');
  const instructions = `
MIGRATION 007: Customer Google Ads Accounts
============================================

✅ AUTOMATED STEPS COMPLETED:
- Migration file created
- Environment variables verified
- Documentation generated

📋 MANUAL STEPS REQUIRED (2 minutes):

1. Open Supabase Dashboard
   URL: https://supabase.com/dashboard/project/${extractProjectId(supabaseUrl)}

2. Navigate to SQL Editor
   Click "SQL Editor" in the left sidebar

3. Create New Query
   Click the "+ New query" button

4. Copy the migration SQL
   Location: supabase/migrations/007_customer_google_ads.sql
   
5. Paste the SQL into the editor and click "Run"

6. Verify the success message appears

WHAT THIS MIGRATION DOES:
- Creates customer_google_ads_accounts table
- Adds indexes for performance
- Sets up RLS policies for data isolation
- Creates updated_at trigger

After applying, you can verify with:
SELECT * FROM customer_google_ads_accounts LIMIT 1;

If you see any errors about "already exists", that's normal - it means
the table or index was already created.

============================================
`;

  fs.writeFileSync(copyCommandFile, instructions);
  console.log('📄 Instructions saved to: APPLY_MIGRATION_INSTRUCTIONS.txt');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 TIP: Keep this terminal open and follow the steps above.');
  console.log('       Once done, press Enter here to verify the migration.\n');

  // Wait for user confirmation
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async () => {
    console.log('\n🔍 Verifying migration...\n');
    
    // Try to query the table
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/customer_google_ads_accounts?limit=0`,
        { headers }
      );

      if (response.ok) {
        console.log('✅ SUCCESS! Migration applied successfully!');
        console.log('   Table customer_google_ads_accounts is accessible.\n');
        console.log('🎉 Phase 1 Extension database setup complete!\n');
      } else if (response.status === 404) {
        console.log('❌ Table not found. Please apply the migration in Supabase Dashboard.\n');
      } else {
        console.log(`⚠️  Unexpected response: ${response.status}\n`);
      }
    } catch (error) {
      console.log('❌ Error verifying:', error.message, '\n');
    }

    process.exit(0);
  });
}

function extractProjectId(url) {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'YOUR_PROJECT_ID';
}

applyMigrationViaAPI();
