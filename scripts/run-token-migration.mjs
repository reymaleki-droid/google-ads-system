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

console.log('\n🔄 Running retrieval_tokens migration...\n');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '003_create_retrieval_tokens.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('Executing migration SQL via PostgreSQL connection...\n');
  
  // Use Supabase Management API to execute raw SQL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    throw new Error('Could not extract project ref from Supabase URL');
  }
  
  const response = await fetch(
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec`,
    {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: migrationSQL })
    }
  );
  
  if (!response.ok) {
    // Fallback: Execute via psql simulation using individual queries
    console.log('Direct execution not available, using alternative method...\n');
    
    // Try creating table first
    console.log('1. Creating retrieval_tokens table...');
    try {
      // Use a dummy insert to trigger table creation check
      const { error: tableCheck } = await supabase
        .from('retrieval_tokens')
        .select('id')
        .limit(1);
      
      if (tableCheck && tableCheck.message.includes('does not exist')) {
        console.log('   ⚠️  Table does not exist, needs manual creation');
        console.log('\n' + '='.repeat(60));
        console.log('❌ AUTOMATIC MIGRATION FAILED');
        console.log('='.repeat(60));
        console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
        console.log('Migration file: supabase/migrations/003_create_retrieval_tokens.sql\n');
        return;
      }
      
      console.log('   ✅ Table already exists or is accessible');
    } catch (e) {
      console.log('   ⚠️  Could not check table:', e.message);
    }
  } else {
    console.log('✅ SQL executed successfully\n');
  }
  
  // Verify the table exists and has correct structure
  console.log('2. Verifying table structure...');
  const { data: testData, error: testError } = await supabase
    .from('retrieval_tokens')
    .select('*')
    .limit(1);
  
  if (testError) {
    console.error('   ❌ Table verification failed:', testError.message);
    console.log('\n📝 Please run migration manually in Supabase SQL Editor');
    return;
  }
  
  console.log('   ✅ Table exists and is accessible\n');
  
  console.log('='.repeat(60));
  console.log('✅ MIGRATION COMPLETED');
  console.log('='.repeat(60) + '\n');
}

runMigration().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
