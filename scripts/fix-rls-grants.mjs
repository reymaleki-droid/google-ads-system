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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase RLS GRANT Fix\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'NOT FOUND'}\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}`);
  console.log(`SQL: ${sql.substring(0, 100)}...`);
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.log(`❌ Error: ${error.message}`);
    
    // Try alternative method: Use postgres REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      console.log(`❌ REST API Error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log(`✅ Success via REST API`);
    return true;
  }
  
  console.log(`✅ Success`);
  return true;
}

async function fixGrants() {
  console.log('\n🔓 Applying GRANT permissions to anon role...\n');
  
  const grants = [
    `GRANT USAGE ON SCHEMA public TO anon;`,
    `GRANT INSERT ON public.leads TO anon;`,
    `GRANT INSERT ON public.bookings TO anon;`,
    `GRANT INSERT ON public.google_tokens TO anon;`,
    `GRANT SELECT ON public.leads TO anon;`,
    `GRANT SELECT ON public.bookings TO anon;`,
    `GRANT SELECT ON public.google_tokens TO anon;`,
  ];
  
  for (const grant of grants) {
    try {
      // Use direct SQL query through Supabase
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: grant });
      
      if (error && !error.message.includes('already granted')) {
        console.log(`⚠️  ${grant}`);
        console.log(`   Error: ${error.message}`);
        
        // Try using direct fetch to Supabase REST API for DDL
        console.log(`   Attempting direct SQL execution...`);
        
        // Since RPC might not exist, let's try a different approach
        // We'll construct a postgres query using the SQL REST endpoint
        const url = `${supabaseUrl}/rest/v1/rpc/query`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: grant })
        });
        
        if (response.ok) {
          console.log(`   ✅ Success`);
        } else {
          console.log(`   ℹ️  Manual execution required`);
        }
      } else {
        console.log(`✅ ${grant}`);
      }
    } catch (err) {
      console.log(`⚠️  ${grant}`);
      console.log(`   Error: ${err.message}`);
    }
  }
  
  console.log('\n📋 GRANT commands to run manually in Supabase SQL Editor:\n');
  console.log(grants.join('\n'));
  console.log('\n');
}

async function verifyGrants() {
  console.log('\n🔍 Verifying table permissions...\n');
  
  const checkQuery = `
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_name IN ('leads', 'bookings', 'google_tokens')
      AND grantee = 'anon'
    ORDER BY table_name, privilege_type;
  `;
  
  try {
    // Try to query using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: checkQuery });
    
    if (error) {
      console.log('⚠️  Cannot query permissions directly');
      console.log('   Run this query in Supabase to verify:');
      console.log(checkQuery);
    } else {
      console.log('Current permissions:', data);
    }
  } catch (err) {
    console.log('⚠️  Error checking permissions:', err.message);
  }
}

async function testInsert() {
  console.log('\n🧪 Testing anon INSERT after GRANT fix...\n');
  
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonClient = createClient(supabaseUrl, anonKey);
  
  const testLead = {
    email: `rls-test-${Date.now()}@example.com`,
    full_name: 'RLS Test User',
    phone: '+971501234567',
    goal_primary: 'leads',
    monthly_budget_range: '1000-5000',
    timeline: 'within-1-month',
    response_within_5_min: true,
    decision_maker: true,
    recommended_package: 'growth',
    lead_score: 85,
    lead_grade: 'A',
    consent: true
  };
  
  console.log('Attempting INSERT with anon client...');
  const { data, error } = await anonClient
    .from('leads')
    .insert(testLead)
    .select()
    .single();
  
  if (error) {
    console.log('❌ INSERT still failing:', error.message);
    console.log('   Error code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
    return false;
  }
  
  console.log('✅ INSERT successful!');
  console.log('   Lead ID:', data.id);
  
  // Cleanup
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  await serviceClient.from('leads').delete().eq('id', data.id);
  console.log('   Test record cleaned up');
  
  return true;
}

// Execute
(async () => {
  try {
    await fixGrants();
    await verifyGrants();
    
    console.log('\n⏳ Waiting 3 seconds for permissions to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = await testInsert();
    
    if (success) {
      console.log('\n✅ RLS GRANTS FIXED - Run full verification:');
      console.log('   node scripts/verify-rls-fixed.mjs\n');
    } else {
      console.log('\n⚠️  Issue persists - Additional diagnostics needed');
      console.log('\nNext steps:');
      console.log('1. Copy the GRANT statements above');
      console.log('2. Run them in Supabase SQL Editor');
      console.log('3. Run: node scripts/verify-rls-fixed.mjs\n');
    }
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err.stack);
  }
})();
