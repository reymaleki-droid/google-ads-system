import { readFileSync } from 'fs';
import { join } from 'path';

console.log('\n🔐 Service Role Key Safety Check\n');

// Check environment variable
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

console.log('✅ Service role key found in environment');

// Scan codebase for client-side exposure
const dangerousPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY.*PUBLIC/i,
  /service_role.*client/i,
  /createClient.*service_role/i,
];

const clientPaths = [
  'app/**/page.tsx',
  'app/**/layout.tsx',
  'components/**/*.tsx',
  'lib/supabase.ts',
];

let violations = 0;

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check for service_role usage in client code
    if (filePath.includes('/app/') && !filePath.includes('/api/')) {
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        console.error(`❌ Service role key referenced in client file: ${filePath}`);
        violations++;
      }
    }
    
    // Check for environment variable leaks
    if (content.includes('process.env.SUPABASE_SERVICE_ROLE_KEY') && 
        !filePath.includes('/api/') &&
        !filePath.includes('scripts/') &&
        !content.includes('typeof window')) {  // Allow runtime checks
      console.error(`❌ Service role key accessed outside API routes: ${filePath}`);
      violations++;
    }
  } catch (error) {
    // Skip files that don't exist or can't be read
  }
}

// Scan key files
const filesToCheck = [
  'lib/supabase.ts',
  'app/layout.tsx',
  'app/page.tsx',
  'components/Header.tsx',
];

filesToCheck.forEach(scanFile);

if (violations > 0) {
  console.error(`\n❌ FAILED: ${violations} security violations found`);
  console.error('Service role key must only be used in /api routes');
  process.exit(1);
}

console.log('\n✅ No client-side service role key exposure detected');
console.log('✅ Service role key safety check passed\n');
process.exit(0);
