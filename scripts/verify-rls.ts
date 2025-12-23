// Test RLS Access Patterns Only (No Policy Creation)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function testRLS() {
  console.log('\n🔒 RLS ACCESS PATTERN VERIFICATION\n');
  console.log('═'.repeat(60));
  
  // Insert test lead via anon
  console.log('\n1️⃣  Testing anon INSERT on leads...');
  const { data: lead, error: insertError } = await anonClient
    .from('leads')
    .insert({
      full_name: 'RLS Verification Test',
      email: `rls-verify-${Date.now()}@test.local`,
      phone: '+971501234567',
      goal_primary: 'Test',
      monthly_budget_range: '1000-1999',
      timeline: 'ASAP',
      lead_score: 50,
      lead_grade: 'B',
      recommended_package: 'growth',
      consent: true
    })
    .select()
    .single();
  
  if (insertError) {
    console.log('   ❌ FAILED:', insertError.message);
    console.log('   RLS may be blocking INSERT (check consent policy)');
    return;
  }
  
  console.log('   ✅ SUCCESS - Lead created:', lead.id.substring(0, 8));
  
  // Test SELECT (should FAIL with RLS)
  console.log('\n2️⃣  Testing anon SELECT (should be BLOCKED)...');
  const { data: selectData, error: selectError } = await anonClient
    .from('leads')
    .select('*')
    .eq('id', lead.id);
  
  const selectBlocked = selectError || !selectData || selectData.length === 0;
  console.log(selectBlocked 
    ? '   ✅ BLOCKED - RLS is working' 
    : '   ❌ NOT BLOCKED - RLS not applied!');
  
  // Test UPDATE (should FAIL with RLS)
  console.log('\n3️⃣  Testing anon UPDATE (should be BLOCKED)...');
  const { error: updateError } = await anonClient
    .from('leads')
    .update({ full_name: 'HACKED' })
    .eq('id', lead.id);
  
  console.log(updateError 
    ? '   ✅ BLOCKED - RLS is working' 
    : '   ❌ NOT BLOCKED - RLS not applied!');
  
  // Test DELETE (should FAIL with RLS)
  console.log('\n4️⃣  Testing anon DELETE (should be BLOCKED)...');
  const { error: deleteError } = await anonClient
    .from('leads')
    .delete()
    .eq('id', lead.id);
  
  console.log(deleteError 
    ? '   ✅ BLOCKED - RLS is working' 
    : '   ❌ NOT BLOCKED - RLS not applied!');
  
  // Test service_role (should SUCCEED)
  console.log('\n5️⃣  Testing service_role full access...');
  const { data: serviceData, error: serviceError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead.id)
    .single();
  
  console.log(!serviceError && serviceData 
    ? '   ✅ FULL ACCESS - service_role bypasses RLS' 
    : '   ❌ FAILED - service_role should have full access');
  
  // Cleanup
  await supabase.from('leads').delete().eq('id', lead.id);
  
  console.log('\n═'.repeat(60));
  
  // Final verdict
  const rlsWorking = selectBlocked && updateError && deleteError && !serviceError;
  
  if (rlsWorking) {
    console.log('\n✅ RLS POLICIES ARE ACTIVE AND WORKING\n');
    console.log('🔐 Database is secured:');
    console.log('   - anon can INSERT only');
    console.log('   - anon cannot SELECT/UPDATE/DELETE');
    console.log('   - service_role has full access\n');
  } else {
    console.log('\n⚠️  RLS POLICIES NOT FULLY APPLIED\n');
    console.log('Required action:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Run: supabase/APPLY_RLS_MANUALLY.sql\n');
  }
}

testRLS().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
