const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Google Ads System setup...\n');

let hasErrors = false;

// Check for .env.local or .env
const envExists = fs.existsSync('.env.local') || fs.existsSync('.env');
if (envExists) {
  console.log('✅ Environment file found');
  
  // Read and check for placeholder values
  const envContent = fs.readFileSync(fs.existsSync('.env.local') ? '.env.local' : '.env', 'utf8');
  
  if (envContent.includes('your-project.supabase.co') || envContent.includes('your-anon-key-here')) {
    console.log('⚠️  WARNING: .env.local still has placeholder values');
    console.log('   Please update with your actual Supabase credentials\n');
    hasErrors = true;
  } else {
    console.log('✅ Environment variables appear to be configured\n');
  }
} else {
  console.log('❌ No .env.local file found');
  console.log('   Copy .env.example to .env.local and add your credentials\n');
  hasErrors = true;
}

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('✅ Dependencies installed');
} else {
  console.log('❌ Dependencies not installed');
  console.log('   Run: npm install\n');
  hasErrors = true;
}

// Check key directories
const requiredDirs = ['app', 'components', 'lib', 'data'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/ directory exists`);
  } else {
    console.log(`❌ ${dir}/ directory missing`);
    hasErrors = true;
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n⚠️  Setup incomplete. Please fix the issues above.\n');
  console.log('📖 See SETUP.md for detailed instructions\n');
  process.exit(1);
} else {
  console.log('\n✨ Setup looks good! Ready to run:\n');
  console.log('   npm run dev\n');
  console.log('📖 See SETUP.md for testing instructions\n');
}
