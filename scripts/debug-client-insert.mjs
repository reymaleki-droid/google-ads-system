import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      value = value.replace(/^["']|["']$/g, '');
      value = value.replace(/\\r\\n/g, '').replace(/\r\n/g, '').replace(/\n/g, '');
      env[key.trim()] = value;
    }
  });
  
  return env;
}

const envPath = join(__dirname, '..', '.env.production');
const env = parseEnvFile(envPath);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Debugging Supabase Client INSERT\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${anonKey.substring(0, 20)}...`);

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test with detailed error logging
const testLead = {
  full_name: 'Client Test',
  email: `client-test-${Date.now()}@test.local`,
  phone: '+971501234567',
  goal_primary: 'Test',
  monthly_budget_range: '1000-1999',
  timeline: 'ASAP',
  lead_score: 50,
  lead_grade: 'B',
  recommended_package: 'growth',
  consent: true
};

console.log('\n📝 Attempting INSERT via Supabase JS Client...');
console.log('Data:', testLead);

// Don't use .select() - anon SELECT is blocked
const { data, error } = await anonClient
  .from('leads')
  .insert(testLead);

if (error) {
  console.log('\n❌ INSERT failed:');
  console.log('Error object:', JSON.stringify(error, null, 2));
  console.log('\nNote: If using .select() after .insert(), it will fail because anon SELECT is blocked.');
  console.log('\nChecking PostgREST headers...');
  
  // Try raw fetch to see actual HTTP response
  const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testLead)
  });
  
  console.log('\nRaw fetch response:');
  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('Body:', responseText);
  
  if (!response.ok) {
    console.log('\n🔧 Possible fixes:');
    console.log('1. Check Supabase Dashboard > Authentication > Policies');
    console.log('2. Verify API settings: Settings > API > Table settings');
    console.log('3. Check PostgREST configuration for role mapping');
  }
} else {
  console.log('\n✅ INSERT successful!');
  console.log('Data returned:', data);
  
  // Note: Cannot retrieve or delete via anon client (SELECT/DELETE blocked)
  console.log('Cleanup skipped - use service_role to clean up test data');
}
