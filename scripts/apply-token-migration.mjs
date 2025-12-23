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
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('\n🔄 Running migration via Supabase Management API...\n');

async function runMigration() {
  // Read migration SQL
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '003_create_retrieval_tokens.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  // Execute via Supabase Management API
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/exec`,
    {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: migrationSQL })
    }
  );
  
  if (!response.ok) {
    console.log('⚠️  Management API not available\n');
    console.log('Using SQL Editor method instead:\n');
    console.log('='.repeat(60));
    console.log(`1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('2. Copy and paste the following SQL:');
    console.log('='.repeat(60));
    console.log('\n' + migrationSQL + '\n');
    console.log('='.repeat(60));
    console.log('3. Click "Run" in the Supabase SQL Editor');
    console.log('4. Return here and press ENTER when done');
    console.log('='.repeat(60) + '\n');
    
    // Wait for user confirmation
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
    
    return;
  }
  
  const result = await response.json();
  console.log('✅ Migration executed\n');
  console.log(result);
}

runMigration().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
