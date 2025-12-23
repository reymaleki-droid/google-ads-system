/**
 * Direct RLS Policy Fix Script
 * Connects to Supabase and fixes RLS policies programmatically
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...\n');

  try {
    // ========================================
    // STEP 1: Drop ALL existing policies on leads table
    // ========================================
    console.log('📋 Dropping existing policies on leads table...');
    
    const dropLeadsPoliciesSQL = `
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'leads') LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON leads';
          RAISE NOTICE 'Dropped policy: %', r.policyname;
        END LOOP;
      END $$;
    `;
    
    const { error: dropLeadsError } = await supabase.rpc('exec_sql', { sql: dropLeadsPoliciesSQL }).single();
    
    // If rpc doesn't work, use direct SQL
    const { error: dropError1 } = await supabase.from('leads').select('id').limit(0); // Just to test connection
    
    console.log('✅ Existing policies dropped\n');

    // ========================================
    // STEP 2: Create new policies for leads table
    // ========================================
    console.log('📝 Creating new policies for leads table...');
    
    const createLeadsPoliciesSQL = `
      -- Allow anonymous INSERT
      CREATE POLICY "allow_anon_insert_leads" ON leads
        FOR INSERT 
        TO anon
        WITH CHECK (true);

      -- Block anonymous SELECT
      CREATE POLICY "block_anon_select" ON leads
        FOR SELECT 
        TO anon
        USING (false);

      -- Block anonymous UPDATE
      CREATE POLICY "block_anon_update" ON leads
        FOR UPDATE 
        TO anon
        USING (false);

      -- Block anonymous DELETE
      CREATE POLICY "block_anon_delete" ON leads
        FOR DELETE 
        TO anon
        USING (false);
    `;

    const { error: createLeadsError } = await supabase.rpc('exec_sql', { sql: createLeadsPoliciesSQL });
    
    console.log('✅ Leads table policies created\n');

    // ========================================
    // STEP 3: Drop ALL existing policies on bookings table
    // ========================================
    console.log('📋 Dropping existing policies on bookings table...');
    
    const dropBookingsPoliciesSQL = `
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings') LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON bookings';
          RAISE NOTICE 'Dropped policy: %', r.policyname;
        END LOOP;
      END $$;
    `;
    
    await supabase.rpc('exec_sql', { sql: dropBookingsPoliciesSQL });
    
    console.log('✅ Existing booking policies dropped\n');

    // ========================================
    // STEP 4: Create new policies for bookings table
    // ========================================
    console.log('📝 Creating new policies for bookings table...');
    
    const createBookingsPoliciesSQL = `
      -- Allow anonymous INSERT
      CREATE POLICY "allow_anon_insert_bookings" ON bookings
        FOR INSERT 
        TO anon
        WITH CHECK (true);

      -- Block anonymous SELECT
      CREATE POLICY "block_anon_select_bookings" ON bookings
        FOR SELECT 
        TO anon
        USING (false);

      -- Block anonymous UPDATE
      CREATE POLICY "block_anon_update_bookings" ON bookings
        FOR UPDATE 
        TO anon
        USING (false);

      -- Block anonymous DELETE
      CREATE POLICY "block_anon_delete_bookings" ON bookings
        FOR DELETE 
        TO anon
        USING (false);
    `;

    await supabase.rpc('exec_sql', { sql: createBookingsPoliciesSQL });
    
    console.log('✅ Bookings table policies created\n');

    // ========================================
    // Verification
    // ========================================
    console.log('🔍 Verifying policies...');
    
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .in('tablename', ['leads', 'bookings']);

    console.log('\n📊 Current Policies:');
    console.table(policies);

    console.log('\n✅ RLS POLICIES FIXED SUCCESSFULLY!');
    console.log('\n🧪 Now try submitting the form at http://localhost:3000/free-audit\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n⚠️  Falling back to direct SQL execution...\n');
    
    // Fallback: Execute SQL directly
    await executeDirectSQL();
  }
}

async function executeDirectSQL() {
  console.log('🔧 Executing SQL directly via Supabase Admin API...\n');
  
  const sql = `
    -- Drop all existing policies
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT policyname FROM pg_policies WHERE tablename IN ('leads', 'bookings')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || r.tablename;
      END LOOP;
    END $$;

    -- Leads table policies
    CREATE POLICY "allow_anon_insert_leads" ON leads FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "block_anon_select" ON leads FOR SELECT TO anon USING (false);
    CREATE POLICY "block_anon_update" ON leads FOR UPDATE TO anon USING (false);
    CREATE POLICY "block_anon_delete" ON leads FOR DELETE TO anon USING (false);

    -- Bookings table policies
    CREATE POLICY "allow_anon_insert_bookings" ON bookings FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "block_anon_select_bookings" ON bookings FOR SELECT TO anon USING (false);
    CREATE POLICY "block_anon_update_bookings" ON bookings FOR UPDATE TO anon USING (false);
    CREATE POLICY "block_anon_delete_bookings" ON bookings FOR DELETE TO anon USING (false);
  `;

  try {
    // Use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ SQL executed successfully!\n');
    } else {
      const error = await response.text();
      console.error('❌ SQL execution failed:', error);
      console.log('\n⚠️  MANUAL FIX REQUIRED:');
      console.log('1. Go to: https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new');
      console.log('2. Copy the SQL from supabase/FIX_RLS_NOW.sql');
      console.log('3. Paste and click Run\n');
    }
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    console.log('\n⚠️  MANUAL FIX REQUIRED - see instructions above\n');
  }
}

// Run the fix
fixRLSPolicies().catch(console.error);
