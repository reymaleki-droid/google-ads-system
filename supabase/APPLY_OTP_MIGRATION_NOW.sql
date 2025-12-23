-- ================================================================
-- OTP PHONE VERIFICATION - COMPLETE SETUP
-- ================================================================
-- Copy this entire file and run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new
-- ================================================================

-- ========================================
-- STEP 1: Check if phone_verifications table exists
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'phone_verifications'
  ) THEN
    RAISE NOTICE '✅ phone_verifications table does NOT exist - will create';
  ELSE
    RAISE NOTICE '⚠️ phone_verifications table already exists - skipping creation';
  END IF;
END $$;

-- ========================================
-- STEP 2: Create phone_verifications table
-- ========================================
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_hash TEXT NOT NULL, -- SHA-256 hash for deduplication
  otp_hash TEXT NOT NULL, -- bcrypt hash (10 rounds)
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- STEP 3: Add phone_verified_at to leads table
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'phone_verified_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN phone_verified_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added phone_verified_at column to leads table';
  ELSE
    RAISE NOTICE '⚠️ phone_verified_at column already exists';
  END IF;
END $$;

-- ========================================
-- STEP 4: Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_phone_verifications_lead_id 
  ON phone_verifications(lead_id);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_hash 
  ON phone_verifications(phone_hash);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_status 
  ON phone_verifications(status);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at 
  ON phone_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_created_at 
  ON phone_verifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_phone_verified_at 
  ON leads(phone_verified_at);

-- ========================================
-- STEP 5: Unique constraint for one active OTP per phone
-- ========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_active_unique 
  ON phone_verifications(phone_hash) 
  WHERE status = 'pending';

-- ========================================
-- STEP 6: Auto-update timestamp trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_phone_verifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_phone_verifications_timestamp ON phone_verifications;

CREATE TRIGGER trigger_update_phone_verifications_timestamp
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verifications_timestamp();

-- ========================================
-- STEP 7: Row Level Security (RLS) policies
-- ========================================
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Service role has full access to phone_verifications" ON phone_verifications;
DROP POLICY IF EXISTS "service_role_phone_verifications_full_access" ON phone_verifications;

-- Service role has full access (API routes use service_role)
CREATE POLICY "service_role_phone_verifications_full_access"
  ON phone_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Block anonymous access (all operations handled via service_role in API)
DROP POLICY IF EXISTS "anon_no_access_phone_verifications" ON phone_verifications;

CREATE POLICY "anon_no_access_phone_verifications"
  ON phone_verifications
  FOR ALL
  TO anon
  USING (false);

-- ========================================
-- STEP 8: Verification Query
-- ========================================
DO $$
DECLARE
  table_exists BOOLEAN;
  column_exists BOOLEAN;
  index_count INT;
  policy_count INT;
BEGIN
  -- Check table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'phone_verifications'
  ) INTO table_exists;

  -- Check column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'phone_verified_at'
  ) INTO column_exists;

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'phone_verifications';

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'phone_verifications';

  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'OTP MIGRATION VERIFICATION REPORT';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'phone_verifications table: %', CASE WHEN table_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'leads.phone_verified_at column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Indexes created: % (expected: 6)', index_count;
  RAISE NOTICE 'RLS policies: % (expected: 2)', policy_count;
  RAISE NOTICE '============================================';
  
  IF table_exists AND column_exists AND index_count >= 6 AND policy_count >= 2 THEN
    RAISE NOTICE '✅ OTP PHONE VERIFICATION SETUP COMPLETE!';
  ELSE
    RAISE NOTICE '⚠️ Some components missing - check output above';
  END IF;
END $$;

-- ========================================
-- DONE! OTP system is ready to use.
-- ========================================

-- Test query (optional - should return 0 rows)
SELECT 
  'phone_verifications table is working' as status,
  COUNT(*) as total_verifications
FROM phone_verifications;
