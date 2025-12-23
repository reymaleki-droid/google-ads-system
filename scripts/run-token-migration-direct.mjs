import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';

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
const dbPassword = env.SUPABASE_DB_PASSWORD || env.DATABASE_PASSWORD;

if (!dbPassword) {
  console.error('\n❌ SUPABASE_DB_PASSWORD or DATABASE_PASSWORD not found in .env.production');
  console.error('Cannot execute raw SQL without direct database connection');
  console.error('\nPlease add SUPABASE_DB_PASSWORD to your .env.production file');
  console.error('Or run the SQL manually in Supabase SQL Editor\n');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project ref from URL');
  process.exit(1);
}

console.log('\n🔄 Running retrieval_tokens migration via direct PostgreSQL connection...\n');

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function runMigration() {
  const sql = postgres(connectionString, {
    max: 1,
    ssl: 'require'
  });
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '003_create_retrieval_tokens.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration SQL...\n');
    
    // Execute the entire migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration executed successfully\n');
    
    // Verify
    console.log('Verifying table and policies...\n');
    
    const policies = await sql`
      SELECT tablename, policyname, roles, cmd
      FROM pg_policies
      WHERE tablename = 'retrieval_tokens'
    `;
    
    console.log(`✅ Found ${policies.length} policies:`);
    policies.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd} for ${p.roles.join(', ')})`);
    });
    
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'retrieval_tokens'
    `;
    
    console.log(`\n✅ Found ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration().catch(error => {
  console.error('\nError:', error);
  process.exit(1);
});
