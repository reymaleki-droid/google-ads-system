/**
 * Local Rate Limit Test
 * 
 * Tests rate limiting on localhost development server
 * Run: npm run dev (in another terminal)
 * Then: node scripts/test-rate-limit-local.mjs
 */

console.log('\n🔒 Local Rate Limit Test\n');
console.log('Make sure dev server is running: npm run dev\n');
console.log('='.repeat(60));

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, path) {
  console.log(`\n📍 ${name}`);
  console.log(`   Path: ${path}`);
  
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const status = response.status;
      const data = await response.json().catch(() => ({}));
      
      const icon = status === 429 ? '🚫' : '✅';
      const label = status === 429 ? 'RATE LIMITED' : `Status ${status}`;
      
      console.log(`   Request ${i}: ${icon} ${label}`);
      
      results.push({ attempt: i, status, limited: status === 429 });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.log(`   Request ${i}: ❌ ${error.message}`);
      results.push({ attempt: i, status: 'error', limited: false });
    }
  }
  
  const limitedCount = results.filter(r => r.limited).length;
  const notLimitedCount = results.filter(r => !r.limited && r.status !== 'error').length;
  
  console.log(`\n   Results: ${notLimitedCount} OK, ${limitedCount} rate limited`);
  
  if (limitedCount >= 1) {
    console.log(`   ✅ PASS: Rate limit enforced`);
    return true;
  } else {
    console.log(`   ❌ FAIL: No rate limiting detected`);
    return false;
  }
}

async function runTests() {
  console.log('Testing all endpoints with rate limiting...\n');
  
  const results = [];
  
  // Test /api/slots
  results.push(await testEndpoint('GET /api/slots', '/api/slots?timezone=Asia/Dubai'));
  
  console.log('\n⏳ Waiting 60s for rate limit reset...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Test /api/leads/retrieve
  results.push(await testEndpoint('GET /api/leads/retrieve', '/api/leads/retrieve?token=test'));
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL RESULTS');
  console.log('='.repeat(60));
  
  const passCount = results.filter(r => r).length;
  console.log(`\n✅ Passed: ${passCount}/${results.length}`);
  
  if (passCount === results.length) {
    console.log('\n🎉 ALL TESTS PASSED\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
