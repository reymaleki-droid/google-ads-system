#!/usr/bin/env node
/**
 * Direct Supabase SQL Executor
 * Uses Management API to execute RLS policy fixes
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL?.split('//')[1]?.split('.')[0];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PROJECT_REF) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔧 Fixing RLS Policies via Supabase API...');
console.log(`📍 Project: ${PROJECT_REF}\n`);

const SQL = `
-- Step 1: Drop all existing policies on leads table
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'leads') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON leads';
  END LOOP;
END $$;

-- Step 2: Drop all existing policies on bookings table
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON bookings';
  END LOOP;
END $$;

-- Step 3: Create fresh policies for leads table
CREATE POLICY "allow_anon_insert_leads" ON leads
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "block_anon_select" ON leads
  FOR SELECT TO anon USING (false);

CREATE POLICY "block_anon_update" ON leads
  FOR UPDATE TO anon USING (false);

CREATE POLICY "block_anon_delete" ON leads
  FOR DELETE TO anon USING (false);

-- Step 4: Create fresh policies for bookings table
CREATE POLICY "allow_anon_insert_bookings" ON bookings
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "block_anon_select_bookings" ON bookings
  FOR SELECT TO anon USING (false);

CREATE POLICY "block_anon_update_bookings" ON bookings
  FOR UPDATE TO anon USING (false);

CREATE POLICY "block_anon_delete_bookings" ON bookings
  FOR DELETE TO anon USING (false);
`;

// Execute SQL via REST API query endpoint
const url = new URL('/rest/v1/rpc/exec', SUPABASE_URL);

const postData = JSON.stringify({ query: SQL });

const options = {
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Prefer': 'return=representation',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ RLS policies fixed successfully!\n');
      console.log('🧪 Now try submitting the form at http://localhost:3000/free-audit\n');
    } else {
      console.error(`❌ API returned status ${res.statusCode}`);
      console.error('Response:', data);
      console.log('\n⚠️  FALLBACK: Copy SQL manually from supabase/FIX_RLS_NOW.sql');
      console.log('    and run in: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new\n');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.log('\n📋 MANUAL STEPS:');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
  console.log('2. Paste this SQL:\n');
  console.log(SQL);
  console.log('\n3. Click RUN\n');
});

req.write(postData);
req.end();
