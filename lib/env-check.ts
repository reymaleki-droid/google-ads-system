/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are set
 * and provides clear error messages for missing variables.
 */

interface EnvCheckResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
  // Supabase - Required for database access
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (server-only)',
  
  // Resend - Required for sending emails
  RESEND_API_KEY: 'Resend API key for email delivery',
  
  // Cron Secret - Required for securing cron endpoints
  CRON_SECRET: 'Secret token for authenticating cron job requests',
};

/**
 * Optional environment variables (Google Calendar integration)
 */
const OPTIONAL_ENV_VARS = {
  GOOGLE_CLIENT_ID: 'Google OAuth client ID (optional - for calendar sync)',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret (optional - for calendar sync)',
  GOOGLE_REDIRECT_URI: 'Google OAuth redirect URI (optional - for calendar sync)',
};

/**
 * Check if all required environment variables are set
 */
export function checkRequiredEnvVars(): EnvCheckResult {
  const missing: string[] = [];
  const errors: string[] = [];

  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
      missing.push(key);
      errors.push(`❌ ${key} is missing or empty (${description})`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Check optional environment variables (warnings, not errors)
 */
export function checkOptionalEnvVars(): { missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key];
    
    if (!value || value.trim() === '') {
      missing.push(key);
      warnings.push(`⚠️  ${key} is not set (${description})`);
    }
  }

  return { missing, warnings };
}

/**
 * Validate environment on startup and log results
 * Call this at the start of API routes or middleware
 */
export function validateEnvironment(): void {
  console.log('\n=== Environment Variable Check ===');
  
  const requiredCheck = checkRequiredEnvVars();
  const optionalCheck = checkOptionalEnvVars();
  
  if (requiredCheck.valid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
    requiredCheck.errors.forEach(error => console.error(`   ${error}`));
    console.error('\n⚠️  Application may not work correctly!');
    console.error('⚠️  Set missing variables in Vercel Dashboard → Settings → Environment Variables\n');
  }
  
  if (optionalCheck.warnings.length > 0) {
    console.log('\n⚠️  Optional features not configured:');
    optionalCheck.warnings.forEach(warning => console.warn(`   ${warning}`));
    console.log('   → Google Calendar integration will be disabled\n');
  }
  
  console.log('===================================\n');
}

/**
 * Throw an error if required environment variables are missing
 * Use this in critical API routes
 */
export function assertRequiredEnvVars(): void {
  const check = checkRequiredEnvVars();
  
  if (!check.valid) {
    const errorMessage = [
      'Missing required environment variables:',
      ...check.errors,
      '',
      'Please set these in Vercel Dashboard:',
      '1. Go to your project: https://vercel.com/dashboard',
      '2. Settings → Environment Variables',
      '3. Add each missing variable',
      '4. Redeploy the application',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}
