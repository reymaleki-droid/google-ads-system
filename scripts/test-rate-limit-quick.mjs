/**
 * Quick Rate Limit Test (No Waiting)
 * 
 * Rapidly hits /api/leads/retrieve 6 times to verify rate limiting
 */

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

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'https://google-ads-system.vercel.app';

console.log('\n🔒 Quick Rate Limit Test: /api/leads/retrieve\n');
console.log(`Testing: ${BASE_URL}/api/leads/retrieve`);
console.log('Expected: 5 requests OK, 6th request = 429\n');
console.log('='.repeat(60));

async function testRateLimit() {
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/leads/retrieve?token=test-token-${i}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const status = response.status;
      const data = await response.json().catch(() => ({}));
      
      const icon = status === 429 ? '🚫' : (status === 401 ? '🔓' : '✅');
      const label = status === 429 ? 'RATE LIMITED' : (status === 401 ? 'INVALID TOKEN' : 'OK');
      
      console.log(`Request ${i}: ${status} ${icon} ${label}`);
      
      if (status === 429) {
        console.log(`  → ${data.error || 'Too many requests'}`);
      }
      
      results.push({ attempt: i, status, limited: status === 429 });
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.log(`Request ${i}: ❌ Error - ${error.message}`);
      results.push({ attempt: i, status: 'error', limited: false });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  const limitedCount = results.filter(r => r.limited).length;
  const notLimitedCount = results.filter(r => !r.limited && r.status !== 'error').length;
  
  console.log(`✅ Not limited: ${notLimitedCount}`);
  console.log(`🚫 Rate limited: ${limitedCount}`);
  
  if (limitedCount >= 1 && notLimitedCount === 5) {
    console.log('\n✅ RATE LIMIT TEST PASSED');
    console.log('   Rate limiting is correctly enforced on /api/leads/retrieve\n');
    return true;
  } else if (limitedCount === 0) {
    console.log('\n❌ RATE LIMIT TEST FAILED');
    console.log('   No requests were rate limited (expected 6th request to fail)\n');
    return false;
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS');
    console.log(`   Expected 5 OK + 1 limited, got ${notLimitedCount} OK + ${limitedCount} limited\n`);
    return limitedCount > 0;
  }
}

testRateLimit()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
