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

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Insert a test record first
const { data: lead } = await anonClient.from('leads').insert({
  full_name: 'Test', email: `test-${Date.now()}@test.com`, phone: '+971501234567',
  goal_primary: 'Test', monthly_budget_range: '1000-1999', timeline: 'ASAP',
  lead_score: 50, lead_grade: 'B', recommended_package: 'growth', consent: true
}).select().single();

console.log('\n📝 Testing UPDATE/DELETE errors:\n');

// Test UPDATE
const { error: updateError } = await anonClient
  .from('leads')
  .update({ full_name: 'Hacked' })
  .eq('id', lead.id);

console.log('UPDATE error:', JSON.stringify(updateError, null, 2));

// Test DELETE  
const { error: deleteError } = await anonClient
  .from('leads')
  .delete()
  .eq('id', lead.id);

console.log('\nDELETE error:', JSON.stringify(deleteError, null, 2));

// Cleanup with service role
const serviceClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
await serviceClient.from('leads').delete().eq('id', lead.id);
