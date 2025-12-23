#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceKey);

let failures = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
    } else {
      console.log(`❌ FAIL: ${name}`);
      failures++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    failures++;
  }
}

async function main() {
  console.log('\n🔒 RLS VERIFICATION\n');

  // Test 1: anon INSERT should succeed
  await test('anon INSERT lead', async () => {
    const { data, error } = await anonClient
      .from('leads')
      .insert({
        full_name: 'RLS Test',
        email: `rls-test-${Date.now()}@test.local`,
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
    
    if (error) return false;
    
    // Store ID for later tests
    global.testLeadId = data.id;
    return true;
  });

  // Test 2: anon SELECT should fail
  await test('anon SELECT leads (should be blocked)', async () => {
    const { data, error } = await anonClient
      .from('leads')
      .select('*')
      .eq('id', global.testLeadId);
    
    // Should either error or return empty
    return error || !data || data.length === 0;
  });

  // Test 3: anon UPDATE should fail
  await test('anon UPDATE lead (should be blocked)', async () => {
    const { error } = await anonClient
      .from('leads')
      .update({ full_name: 'Hacked' })
      .eq('id', global.testLeadId);
    
    return !!error;
  });

  // Test 4: anon DELETE should fail
  await test('anon DELETE lead (should be blocked)', async () => {
    const { error } = await anonClient
      .from('leads')
      .delete()
      .eq('id', global.testLeadId);
    
    return !!error;
  });

  // Test 5: service_role SELECT should succeed
  await test('service_role SELECT leads', async () => {
    const { data, error } = await serviceClient
      .from('leads')
      .select('*')
      .eq('id', global.testLeadId)
      .single();
    
    return !error && data;
  });

  // Test 6: service_role UPDATE should succeed
  await test('service_role UPDATE lead', async () => {
    const { error } = await serviceClient
      .from('leads')
      .update({ status: 'qualified' })
      .eq('id', global.testLeadId);
    
    return !error;
  });

  // Test 7: service_role DELETE should succeed (cleanup)
  await test('service_role DELETE lead', async () => {
    const { error } = await serviceClient
      .from('leads')
      .delete()
      .eq('id', global.testLeadId);
    
    return !error;
  });

  // Test 8: anon INSERT booking should succeed
  await test('anon INSERT booking', async () => {
    const { data: lead } = await serviceClient
      .from('leads')
      .insert({
        full_name: 'Booking Test',
        email: `booking-test-${Date.now()}@test.local`,
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

    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const { data, error } = await anonClient
      .from('bookings')
      .insert({
        lead_id: lead.id,
        selected_start: futureDate,
        selected_end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        booking_timezone: 'Asia/Dubai',
        customer_name: 'Test',
        customer_email: lead.email
      })
      .select()
      .single();
    
    global.testBookingId = data?.id;
    global.testBookingLeadId = lead.id;
    return !error && data;
  });

  // Test 9: anon SELECT bookings should fail
  await test('anon SELECT bookings (should be blocked)', async () => {
    const { data, error } = await anonClient
      .from('bookings')
      .select('*')
      .eq('id', global.testBookingId);
    
    return error || !data || data.length === 0;
  });

  // Test 10: service_role can access bookings
  await test('service_role SELECT bookings', async () => {
    const { data, error } = await serviceClient
      .from('bookings')
      .select('*')
      .eq('id', global.testBookingId)
      .single();
    
    return !error && data;
  });

  // Cleanup
  await serviceClient.from('bookings').delete().eq('id', global.testBookingId);
  await serviceClient.from('leads').delete().eq('id', global.testBookingLeadId);

  console.log(`\n${failures === 0 ? '✅' : '❌'} ${failures === 0 ? 'ALL TESTS PASSED' : `${failures} TESTS FAILED`}\n`);
  process.exit(failures);
}

main();
