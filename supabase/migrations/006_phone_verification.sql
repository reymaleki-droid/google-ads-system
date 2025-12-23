-- Migration 006: Phone Verification System
-- Purpose: Add OTP-based phone verification before booking confirmation
-- Dependencies: Existing leads table

-- 1. Create phone_verifications table
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

-- 2. Add phone_verified_at column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- 3. Create indexes for performance
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

-- 4. Unique constraint: Only one active OTP per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_active_unique 
  ON phone_verifications(phone_hash) 
  WHERE status = 'pending';

-- 5. Row Level Security (RLS) policies
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API routes use service_role)
CREATE POLICY "Service role has full access to phone_verifications"
  ON phone_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_phone_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verifications_updated_at();

-- 7. Auto-expire old OTPs (optional cleanup job)
-- Run this via cron or manually: DELETE FROM phone_verifications WHERE status = 'pending' AND expires_at < NOW();

-- 8. Comments for documentation
COMMENT ON TABLE phone_verifications IS 'OTP verification records for lead phone numbers';
COMMENT ON COLUMN phone_verifications.phone_hash IS 'SHA-256 hash of phone number for deduplication';
COMMENT ON COLUMN phone_verifications.otp_hash IS 'bcrypt hash of 6-digit OTP (10 rounds)';
COMMENT ON COLUMN phone_verifications.attempts IS 'Failed verification attempts (max 3)';
COMMENT ON COLUMN phone_verifications.expires_at IS 'OTP expiration time (5 minutes from creation)';
COMMENT ON COLUMN leads.phone_verified_at IS 'Timestamp when phone number was verified via OTP';
