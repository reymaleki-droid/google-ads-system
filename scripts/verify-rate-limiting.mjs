#!/usr/bin/env node

/**
 * Rate Limiting Verification
 * 
 * Checks that all required endpoints have rate limiting configured
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Rate Limiting Verification\n');
console.log('='.repeat(60));

const endpoints = [
  {
    name: '/api/leads (POST)',
    file: 'app/api/leads/route.ts',
    patterns: [
      'import.*rateLimit',
      'rateLimit\\(\\s*{\\s*maxRequests:\\s*5',
      'rateLimitResponse.*leadRateLimit\\(request\\)',
      'if.*rateLimitResponse.*return rateLimitResponse'
    ]
  },
  {
    name: '/api/leads/retrieve (GET)',
    file: 'app/api/leads/retrieve/route.ts',
    patterns: [
      'import.*rateLimit',
      'rateLimit\\(\\s*{\\s*maxRequests:\\s*5',
      'rateLimitResponse.*retrieveRateLimit\\(request\\)',
      'if.*rateLimitResponse.*return rateLimitResponse'
    ]
  },
  {
    name: '/api/bookings (POST)',
    file: 'app/api/bookings/route.ts',
    patterns: [
      'import.*rateLimit',
      'rateLimit\\(\\s*{\\s*maxRequests:\\s*5',
      'rateLimitResponse.*bookingRateLimit\\(request\\)',
      'if.*rateLimitResponse.*return rateLimitResponse'
    ]
  },
  {
    name: '/api/slots (GET)',
    file: 'app/api/slots/route.ts',
    patterns: [
      'import.*rateLimit',
      'rateLimit\\(\\s*{\\s*maxRequests:\\s*5',
      'rateLimitResponse.*slotsRateLimit\\(request\\)',
      'if.*rateLimitResponse.*return rateLimitResponse'
    ]
  }
];

let allPassed = true;

for (const endpoint of endpoints) {
  console.log(`\n📍 ${endpoint.name}`);
  console.log(`   File: ${endpoint.file}`);
  
  try {
    const filePath = join(__dirname, '..', endpoint.file);
    const content = readFileSync(filePath, 'utf-8');
    
    let passed = true;
    const results = [];
    
    for (const pattern of endpoint.patterns) {
      const regex = new RegExp(pattern, 'i');
      const found = regex.test(content);
      results.push({ pattern, found });
      
      if (!found) passed = false;
    }
    
    if (passed) {
      console.log('   ✅ PASS: Rate limiting configured correctly');
    } else {
      console.log('   ❌ FAIL: Missing required patterns:');
      results.filter(r => !r.found).forEach(r => {
        console.log(`      - ${r.pattern}`);
      });
      allPassed = false;
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('✅ ALL ENDPOINTS HAVE RATE LIMITING\n');
  console.log('Configuration:');
  console.log('  - Rate: 5 requests per minute');
  console.log('  - Tracking: Per IP address');
  console.log('  - Response: HTTP 429 on violation');
  console.log('  - Message: "Too many requests. Please try again later."\n');
  process.exit(0);
} else {
  console.log('❌ SOME ENDPOINTS MISSING RATE LIMITING\n');
  process.exit(1);
}
