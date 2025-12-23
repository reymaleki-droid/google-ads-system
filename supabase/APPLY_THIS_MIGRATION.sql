-- ============================================================================
-- COMBINED MIGRATION: Stage 5 + OTP Phone Verification
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to set up:
-- 1. Attribution tracking tables (Stage 5)
-- 2. Phone verification tables (OTP system)
-- ============================================================================

-- ============================================================================
-- PART 1: ATTRIBUTION EVENTS TABLE (Stage 5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Session & Request Context
  session_id TEXT NOT NULL,
  request_id TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  
  -- Attribution Parameters (UTM)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Platform Click IDs
  gclid TEXT,
  wbraid TEXT,
  gbraid TEXT,
  fbclid TEXT,
  
  -- Landing Context
  referrer TEXT,
  landing_path TEXT NOT NULL,
  
  -- Entity Linkage
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Metadata
  raw_params JSONB
);

CREATE INDEX IF NOT EXISTS idx_attribution_events_session ON attribution_events(session_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_lead ON attribution_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_events_booking ON attribution_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_events_gclid ON attribution_events(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_events_fbclid ON attribution_events(fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_events_utm_source ON attribution_events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_events_utm_campaign ON attribution_events(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attribution_events_created_at ON attribution_events(created_at DESC);

-- ============================================================================
-- PART 2: CONVERSION EVENTS TABLE (Stage 5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event Classification
  event_type TEXT NOT NULL CHECK (event_type IN ('booking_created', 'booking_completed')),
  provider TEXT NOT NULL CHECK (provider IN ('google_ads', 'meta')),
  
  -- Entity References
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Conversion Value
  conversion_value DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Attribution Data
  gclid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  fbclid TEXT,
  fbc TEXT,
  fbp TEXT,
  
  -- Send State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  
  -- Platform Response
  platform_response JSONB,
  
  -- Deduplication
  idempotency_key TEXT UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_status ON conversion_events(status);
CREATE INDEX IF NOT EXISTS idx_conversion_events_provider ON conversion_events(provider);
CREATE INDEX IF NOT EXISTS idx_conversion_events_lead ON conversion_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_booking ON conversion_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON conversion_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_gclid ON conversion_events(gclid) WHERE gclid IS NOT NULL;

-- ============================================================================
-- PART 3: SUSPICIOUS EVENTS TABLE (Security)
-- ============================================================================

CREATE TABLE IF NOT EXISTS suspicious_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event Classification
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Context
  ip_address TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  endpoint TEXT,
  request_id TEXT,
  
  -- Details
  reason_code TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  
  -- Entity References
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_suspicious_events_created_at ON suspicious_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_ip_hash ON suspicious_events(ip_hash);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_reason ON suspicious_events(reason_code);
CREATE INDEX IF NOT EXISTS idx_suspicious_events_endpoint ON suspicious_events(endpoint);

-- ============================================================================
-- PART 4: PHONE VERIFICATION TABLES (OTP System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
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

-- Add phone_verified_at column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Indexes for phone_verifications
CREATE INDEX IF NOT EXISTS idx_phone_verifications_lead_id ON phone_verifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_hash ON phone_verifications(phone_hash);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_status ON phone_verifications(status);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON phone_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_created_at ON phone_verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone_verified_at ON leads(phone_verified_at);

-- Unique constraint: Only one active OTP per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_active_unique 
  ON phone_verifications(phone_hash) 
  WHERE status = 'pending';

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Attribution events
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON attribution_events;
CREATE POLICY "Service role full access" ON attribution_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Conversion events
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON conversion_events;
CREATE POLICY "Service role full access" ON conversion_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Suspicious events
ALTER TABLE suspicious_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON suspicious_events;
CREATE POLICY "Service role full access" ON suspicious_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Phone verifications
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON phone_verifications;
CREATE POLICY "Service role full access" ON phone_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 6: TRIGGERS
-- ============================================================================

-- Updated_at trigger for phone_verifications
CREATE OR REPLACE FUNCTION update_phone_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS phone_verifications_updated_at ON phone_verifications;
CREATE TRIGGER phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verifications_updated_at();

-- Updated_at trigger for conversion_events
CREATE OR REPLACE FUNCTION update_conversion_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversion_events_updated_at ON conversion_events;
CREATE TRIGGER conversion_events_updated_at
  BEFORE UPDATE ON conversion_events
  FOR EACH ROW
  EXECUTE FUNCTION update_conversion_events_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created:
-- - attribution_events (Stage 5: Attribution tracking)
-- - conversion_events (Stage 5: Conversion dedupe)
-- - suspicious_events (Security: Fraud detection)
-- - phone_verifications (OTP: Phone verification)
-- 
-- Columns added:
-- - leads.phone_verified_at (OTP: Verification timestamp)
-- ============================================================================
