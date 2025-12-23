#!/usr/bin/env node

/**
 * OTP Flow Testing Script
 * Creates a test lead and provides the schedule URL
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTestLead() {
  console.log('\n🧪 Creating test lead for OTP flow...\n');

  const testData = {
    full_name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    phone: '+14155552671',
    website: 'https://example.com',
    company_name: 'Test Company',
    current_ad_spend: 5000,
    industry: 'Technology',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Test)',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(testData)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create test lead:', error.message);
    process.exit(1);
  }

  console.log('✅ Test lead created successfully!\n');
  console.log('📋 Lead Details:');
  console.log(`   Name: ${data.full_name}`);
  console.log(`   Email: ${data.email}`);
  console.log(`   Phone: ${data.phone}`);
  console.log(`   Lead ID: ${data.id}\n`);
  console.log('🔗 Test URL:');
  console.log(`   http://localhost:3000/schedule?lead_id=${data.id}\n`);
  console.log('📝 Testing Steps:');
  console.log('   1. Open the URL above in your browser');
  console.log('   2. Select any available time slot');
  console.log('   3. Click "Confirm Booking"');
  console.log('   4. OTP modal will appear');
  console.log('   5. Check terminal for OTP code (mock provider logs it)');
  console.log('   6. Enter the 6-digit code');
  console.log('   7. Booking should succeed after verification\n');
  console.log('🔍 Expected Console Output:');
  console.log('   ┌──────────────────────────────────────────────────────────┐');
  console.log('   │ 📱 MOCK SMS PROVIDER (Testing Mode)                      │');
  console.log('   ├──────────────────────────────────────────────────────────┤');
  console.log('   │ To: +1******2671                                         │');
  console.log('   │ OTP Code: 123456                                         │');
  console.log('   │ Status: ✅ Logged (No real SMS sent)                    │');
  console.log('   └──────────────────────────────────────────────────────────┘\n');
}

createTestLead();
