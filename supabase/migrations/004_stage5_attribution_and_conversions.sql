-- Stage 5: Attribution, Conversion Tracking, and Ads Integration
-- Purpose: Implement server-side attribution capture, conversion dedupe, and ads platform integration

-- ============================================================================
-- ATTRIBUTION EVENTS TABLE
-- ============================================================================
-- Captures server-side attribution data linked to leads and bookings

CREATE TABLE IF NOT EXISTS attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Session & Request Context
  session_id TEXT NOT NULL, -- Signed session ID from client
  request_id TEXT, -- Unique request identifier for correlation
  ip_hash TEXT, -- SHA-256 hash of IP address (privacy-safe)
  user_agent_hash TEXT, -- SHA-256 hash of user agent
  
  -- Attribution Parameters (UTM)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Platform Click IDs
  gclid TEXT, -- Google Ads Click ID
  wbraid TEXT, -- Google Ads Web to App conversion ID
  gbraid TEXT, -- Google Ads iOS 14.5+ conversion ID
  fbclid TEXT, -- Meta/Facebook Click ID
  
  -- Landing Context
  referrer TEXT,
  landing_path TEXT NOT NULL,
  
  -- Entity Linkage
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Metadata
  raw_params JSONB -- Store all query params for debugging
);

-- Indexes for performance
CREATE INDEX idx_attribution_events_session ON attribution_events(session_id);
CREATE INDEX idx_attribution_events_lead ON attribution_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_attribution_events_booking ON attribution_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_attribution_events_gclid ON attribution_events(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX idx_attribution_events_fbclid ON attribution_events(fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX idx_attribution_events_utm_source ON attribution_events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX idx_attribution_events_utm_campaign ON attribution_events(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_attribution_events_created_at ON attribution_events(created_at DESC);

-- ============================================================================
-- CONVERSION EVENTS TABLE
-- ============================================================================
-- Source of truth for all conversion events sent to ad platforms
-- Ensures dedupe and idempotent sending

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Event Definition
  event_type TEXT NOT NULL CHECK (event_type IN (
    'lead_created',
    'lead_qualified', 
    'booking_created',
    'booking_confirmed',
    'reminder_sent',
    'call_completed'
  )),
  
  -- Entity Linkage
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Provider Configuration
  provider TEXT NOT NULL CHECK (provider IN ('google_ads', 'meta_capi', 'internal')),
  
  -- Deduplication Key (UNIQUE constraint prevents double sends)
  dedupe_key TEXT NOT NULL UNIQUE,
  
  -- Processing Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  retry_after TIMESTAMPTZ, -- Respect provider rate limits
  
  -- Error Tracking
  error_message TEXT,
  error_code TEXT,
  
  -- Provider Response
  provider_response JSONB, -- Store provider's response for debugging
  
  -- Conversion Value (for ROAS tracking)
  conversion_value DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD'
);

-- Indexes for queue processing
CREATE INDEX idx_conversion_events_status_pending ON conversion_events(created_at) 
  WHERE status = 'pending';
CREATE INDEX idx_conversion_events_status_retry ON conversion_events(retry_after) 
  WHERE status = 'failed' AND retry_after IS NOT NULL;
CREATE INDEX idx_conversion_events_lead ON conversion_events(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_conversion_events_booking ON conversion_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_conversion_events_provider ON conversion_events(provider, status);
CREATE INDEX idx_conversion_events_event_type ON conversion_events(event_type);

-- ============================================================================
-- SUSPICIOUS EVENTS TABLE (Optional - Bot/Abuse Detection)
-- ============================================================================
-- Records blocked or suspicious requests for analysis

CREATE TABLE IF NOT EXISTS suspicious_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Request Context
  endpoint TEXT NOT NULL, -- e.g., /api/leads, /api/bookings
  method TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT,
  
  -- Reason for Blocking
  reason_code TEXT NOT NULL CHECK (reason_code IN (
    'rate_limit_exceeded',
    'honeypot_triggered',
    'invalid_payload',
    'replay_attack',
    'timing_anomaly',
    'missing_session',
    'invalid_signature',
    'suspicious_pattern'
  )),
  
  -- Details
  details JSONB, -- Additional context for investigation
  session_id TEXT,
  
  -- Severity
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high'))
);

CREATE INDEX idx_suspicious_events_created_at ON suspicious_events(created_at DESC);
CREATE INDEX idx_suspicious_events_ip_hash ON suspicious_events(ip_hash);
CREATE INDEX idx_suspicious_events_reason ON suspicious_events(reason_code);
CREATE INDEX idx_suspicious_events_endpoint ON suspicious_events(endpoint);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Maintain strict security - anon users cannot read these tables

-- Attribution Events: Service role only
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON attribution_events FOR ALL USING (false);

-- Conversion Events: Service role only
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON conversion_events FOR ALL USING (false);

-- Suspicious Events: Service role only
ALTER TABLE suspicious_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON suspicious_events FOR ALL USING (false);

-- ============================================================================
-- GRANTS (PostgREST compatibility)
-- ============================================================================
-- Grant table-level access but RLS blocks actual reads

GRANT SELECT, INSERT, UPDATE ON attribution_events TO anon;
GRANT SELECT, INSERT, UPDATE ON conversion_events TO anon;
GRANT SELECT, INSERT ON suspicious_events TO anon;
