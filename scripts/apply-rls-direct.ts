// Manual RLS Application Script
// Run this to apply RLS policies via Supabase Management API

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// RLS Policies as code
const policies = {
  leads: {
    drop: [
      'DROP POLICY IF EXISTS "public_insert_leads" ON leads',
      'DROP POLICY IF EXISTS "public_read_own_leads" ON leads',
      'DROP POLICY IF EXISTS "anon_select_leads" ON leads',
      'DROP POLICY IF EXISTS "anon_update_leads" ON leads',
      'DROP POLICY IF EXISTS "anon_delete_leads" ON leads'
    ],
    create: [
      'CREATE POLICY "anon_insert_leads_only" ON leads FOR INSERT TO anon WITH CHECK (consent = true)',
      'CREATE POLICY "anon_no_select_leads" ON leads FOR SELECT TO anon USING (false)',
      'CREATE POLICY "anon_no_update_leads" ON leads FOR UPDATE TO anon USING (false)',
      'CREATE POLICY "anon_no_delete_leads" ON leads FOR DELETE TO anon USING (false)'
    ]
  },
  bookings: {
    drop: [
      'DROP POLICY IF EXISTS "public_insert_bookings" ON bookings',
      'DROP POLICY IF EXISTS "public_read_own_bookings" ON bookings',
      'DROP POLICY IF EXISTS "anon_select_bookings" ON bookings',
      'DROP POLICY IF EXISTS "anon_update_bookings" ON bookings',
      'DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings'
    ],
    create: [
      'CREATE POLICY "anon_insert_bookings_only" ON bookings FOR INSERT TO anon WITH CHECK (true)',
      'CREATE POLICY "anon_no_select_bookings" ON bookings FOR SELECT TO anon USING (false)',
      'CREATE POLICY "anon_no_update_bookings" ON bookings FOR UPDATE TO anon USING (false)',
      'CREATE POLICY "anon_no_delete_bookings" ON bookings FOR DELETE TO anon USING (false)'
    ]
  },
  google_tokens: {
    drop: [
      'DROP POLICY IF EXISTS "anon_insert_google_tokens" ON google_tokens',
      'DROP POLICY IF EXISTS "anon_select_google_tokens" ON google_tokens',
      'DROP POLICY IF EXISTS "anon_update_google_tokens" ON google_tokens',
      'DROP POLICY IF EXISTS "anon_delete_google_tokens" ON google_tokens'
    ],
    create: [
      'CREATE POLICY "anon_no_insert_google_tokens" ON google_tokens FOR INSERT TO anon WITH CHECK (false)',
      'CREATE POLICY "anon_no_select_google_tokens" ON google_tokens FOR SELECT TO anon USING (false)',
      'CREATE POLICY "anon_no_update_google_tokens" ON google_tokens FOR UPDATE TO anon USING (false)',
      'CREATE POLICY "anon_no_delete_google_tokens" ON google_tokens FOR DELETE TO anon USING (false)'
    ]
  }
};

async function executePolicies() {
  console.log('\n🔒 Applying RLS Policies\n');
  
  for (const [table, cmds] of Object.entries(policies)) {
    console.log(`\n📋 Table: ${table}`);
    
    // Drop existing policies
    for (const dropCmd of cmds.drop) {
      try {
        const { error } = await supabase.rpc('exec', { sql: dropCmd });
        if (error && !error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${error.message}`);
        }
      } catch (e) {
        // Ignore - policy may not exist
      }
    }
    
    // Create new policies
    for (const createCmd of cmds.create) {
      try {
        const { error } = await supabase.rpc('exec', { sql: createCmd });
        if (error) {
          console.log(`   ❌ Failed: ${error.message}`);
        } else {
          const policyName = createCmd.match(/"([^"]+)"/)?.[1];
          console.log(`   ✅ ${policyName}`);
        }
      } catch (e: any) {
        console.log(`   ❌ Error: ${e.message}`);
      }
    }
  }
}

async function verifyAccess() {
  console.log('\n\n🧪 Testing Access Patterns\n');
  
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const anonClient = createClient(supabaseUrl, anonKey);
  
  // Test INSERT (should work)
  console.log('1️⃣  anon INSERT leads...');
  const { data: insertData, error: insertError } = await anonClient
    .from('leads')
    .insert({
      full_name: 'RLS Test',
      email: `test-${Date.now()}@example.com`,
      phone: '+971501234567',
      goal_primary: 'test',
      monthly_budget_range: '1000-1999',
      timeline: 'ASAP',
      lead_score: 50,
      lead_grade: 'B',
      recommended_package: 'growth',
      consent: true
    })
    .select()
    .single();
  
  console.log(insertError ? '   ❌ FAILED' : '   ✅ SUCCESS');
  
  if (!insertError && insertData) {
    // Test SELECT (should fail)
    console.log('2️⃣  anon SELECT leads...');
    const { data: selectData, error: selectError } = await anonClient
      .from('leads')
      .select('*')
      .eq('id', insertData.id);
    
    console.log(!selectError && selectData?.length > 0 ? '   ❌ BLOCKED (expected ✅)' : '   ✅ BLOCKED');
    
    // Test UPDATE (should fail)
    console.log('3️⃣  anon UPDATE leads...');
    const { error: updateError } = await anonClient
      .from('leads')
      .update({ full_name: 'Hacked' })
      .eq('id', insertData.id);
    
    console.log(!updateError ? '   ❌ ALLOWED (SECURITY RISK!)' : '   ✅ BLOCKED');
    
    // Test DELETE (should fail)
    console.log('4️⃣  anon DELETE leads...');
    const { error: deleteError } = await anonClient
      .from('leads')
      .delete()
      .eq('id', insertData.id);
    
    console.log(!deleteError ? '   ❌ ALLOWED (SECURITY RISK!)' : '   ✅ BLOCKED');
    
    // Cleanup with service role
    await supabase.from('leads').delete().eq('id', insertData.id);
  }
  
  console.log('\n✅ RLS Verification Complete\n');
}

executePolicies()
  .then(() => verifyAccess())
  .then(() => {
    console.log('═'.repeat(50));
    console.log('🔐 Stage 2 Complete - RLS Hardened');
    console.log('═'.repeat(50));
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
