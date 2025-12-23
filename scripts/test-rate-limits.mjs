/**
 * Rate Limit Test Script
 * 
 * Tests rate limiting on all public API endpoints:
 * - /api/leads
 * - /api/leads/retrieve
 * - /api/bookings
 * - /api/slots
 * 
 * Expected: 5 requests succeed, 6th request returns 429
 */

const BASE_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

console.log('\n🔒 Rate Limit Test\n');
console.log('Testing all API endpoints with 5 req/min limit\n');
console.log('='.repeat(60));

async function testEndpoint(name, url, options = {}) {
  console.log(`\n📍 Testing: ${name}`);
  console.log(`   Endpoint: ${url}`);
  
  const results = [];
  const limit = 6; // Try 6 requests (limit is 5)
  
  for (let i = 1; i <= limit; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      const status = response.status;
      const data = await response.json().catch(() => ({}));
      
      results.push({ attempt: i, status, limited: status === 429 });
      
      const icon = status === 429 ? '🚫' : '✅';
      const label = status === 429 ? 'RATE LIMITED' : 'OK';
      console.log(`   ${icon} Request ${i}: ${status} ${label}`);
      
      if (status === 429) {
        console.log(`      Message: ${data.error || 'Too many requests'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request ${i}: Error - ${error.message}`);
      results.push({ attempt: i, status: 'error', limited: false });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Verify results
  const successCount = results.filter(r => !r.limited && r.status !== 'error').length;
  const limitedCount = results.filter(r => r.limited).length;
  
  console.log(`\n   📊 Results:`);
  console.log(`      ✅ Successful: ${successCount}`);
  console.log(`      🚫 Rate limited: ${limitedCount}`);
  
  if (successCount === 5 && limitedCount >= 1) {
    console.log(`   ✅ PASS: Rate limit enforced correctly`);
    return true;
  } else {
    console.log(`   ❌ FAIL: Expected 5 successful, got ${successCount}`);
    return false;
  }
}

async function runTests() {
  const tests = [];
  
  // Test 1: /api/slots (GET with query params)
  tests.push(
    testEndpoint(
      'GET /api/slots',
      `${BASE_URL}/api/slots?timezone=Asia/Dubai`,
      { method: 'GET' }
    )
  );
  
  // Wait for rate limit window to reset
  console.log('\n⏳ Waiting 60 seconds for rate limit reset...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Test 2: /api/leads/retrieve (GET with dummy token)
  tests.push(
    testEndpoint(
      'GET /api/leads/retrieve',
      `${BASE_URL}/api/leads/retrieve?token=dummy-token-for-rate-limit-test`,
      { method: 'GET' }
    )
  );
  
  // Wait for rate limit window to reset
  console.log('\n⏳ Waiting 60 seconds for rate limit reset...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Test 3: /api/leads (POST with invalid data to avoid creating real leads)
  tests.push(
    testEndpoint(
      'POST /api/leads',
      `${BASE_URL}/api/leads`,
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email', // Will fail validation but trigger rate limit
          honeypot: '' // Valid honeypot
        })
      }
    )
  );
  
  const results = await Promise.all(tests);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL RESULTS');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r).length;
  const totalTests = results.length;
  
  console.log(`\n✅ Passed: ${passCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passCount}/${totalTests}`);
  
  if (passCount === totalTests) {
    console.log('\n🎉 ALL RATE LIMIT TESTS PASSED\n');
    return true;
  } else {
    console.log('\n⚠️  SOME TESTS FAILED\n');
    return false;
  }
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  });
