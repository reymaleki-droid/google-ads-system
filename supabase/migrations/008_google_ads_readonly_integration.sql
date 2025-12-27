-- Migration 008: Google Ads Read-Only Integration
-- Purpose: Add tables for Google Ads OAuth tokens and cached report data
-- Phase: 3 (Read-Only Reporting Dashboard)
-- Date: 2025-12-27

-- ============================================================================
-- GOOGLE ADS ACCOUNTS TABLE
-- Store OAuth tokens for Google Ads API (read-only scope)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google Ads account details
  google_ads_customer_id TEXT NOT NULL, -- Format: "123-456-7890"
  account_name TEXT,
  currency_code TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'America/New_York',
  
  -- OAuth tokens (read-only scope)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL, -- Must be 'https://www.googleapis.com/auth/adwords'
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired', 'error')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one Google Ads account per customer
  UNIQUE(customer_id, google_ads_customer_id)
);

-- ============================================================================
-- GOOGLE ADS REPORTS TABLE
-- Cache report data to reduce API calls and improve performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_ads_account_id UUID NOT NULL REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  
  -- Report metadata
  report_type TEXT NOT NULL CHECK (report_type IN (
    'campaign_performance',
    'ad_group_performance',
    'keyword_performance',
    'search_terms',
    'account_summary'
  )),
  date_range TEXT NOT NULL CHECK (date_range IN (
    'TODAY',
    'YESTERDAY',
    'LAST_7_DAYS',
    'LAST_14_DAYS',
    'LAST_30_DAYS',
    'THIS_MONTH',
    'LAST_MONTH',
    'CUSTOM'
  )),
  start_date DATE,
  end_date DATE,
  
  -- Report data (JSONB for flexibility)
  data JSONB NOT NULL,
  
  -- Cache metadata
  row_count INT,
  data_size_bytes INT,
  query_duration_ms INT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes'
);

-- ============================================================================
-- GOOGLE ADS API USAGE TABLE
-- Track API calls for rate limiting and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_ads_account_id UUID REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  request_body JSONB,
  
  -- Response details
  status_code INT,
  response_time_ms INT,
  error_message TEXT,
  
  -- Rate limiting
  operations_consumed INT DEFAULT 1,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Google Ads Accounts
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_customer_id 
  ON google_ads_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_status 
  ON google_ads_accounts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_expires 
  ON google_ads_accounts(expires_at) WHERE status = 'active';

-- Google Ads Reports (cache lookup)
CREATE INDEX IF NOT EXISTS idx_google_ads_reports_customer_id 
  ON google_ads_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_reports_account_id 
  ON google_ads_reports(google_ads_account_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_reports_type_range 
  ON google_ads_reports(report_type, date_range);
CREATE INDEX IF NOT EXISTS idx_google_ads_reports_expires 
  ON google_ads_reports(expires_at);

-- API Usage (rate limiting & analytics)
CREATE INDEX IF NOT EXISTS idx_google_ads_api_usage_customer_id 
  ON google_ads_api_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_api_usage_created_at 
  ON google_ads_api_usage(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Customers can only see their own Google Ads data
-- ============================================================================

ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_api_usage ENABLE ROW LEVEL SECURITY;

-- Google Ads Accounts: Users see only their own accounts
CREATE POLICY "Users see own Google Ads accounts" 
  ON google_ads_accounts
  FOR ALL
  USING (customer_id = auth.uid());

-- Google Ads Reports: Users see only their own reports
CREATE POLICY "Users see own Google Ads reports"
  ON google_ads_reports
  FOR ALL
  USING (customer_id = auth.uid());

-- API Usage: Users see only their own usage
CREATE POLICY "Users see own API usage"
  ON google_ads_api_usage
  FOR ALL
  USING (customer_id = auth.uid());

-- Service role has full access (for background jobs)
CREATE POLICY "Service role manages Google Ads accounts"
  ON google_ads_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages Google Ads reports"
  ON google_ads_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages API usage"
  ON google_ads_api_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_google_ads_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_ads_accounts_updated_at
  BEFORE UPDATE ON google_ads_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_google_ads_accounts_updated_at();

-- ============================================================================
-- CLEANUP FUNCTIONS
-- Auto-delete expired cache entries (run via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_google_ads_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM google_ads_reports
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-delete old API usage logs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_google_ads_api_usage()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM google_ads_api_usage
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE google_ads_accounts IS 'OAuth tokens for Google Ads API (read-only scope)';
COMMENT ON COLUMN google_ads_accounts.scope IS 'Must be https://www.googleapis.com/auth/adwords (read-only)';
COMMENT ON COLUMN google_ads_accounts.google_ads_customer_id IS 'Google Ads customer ID (e.g., 123-456-7890)';

COMMENT ON TABLE google_ads_reports IS 'Cached report data to reduce API calls (30-minute TTL)';
COMMENT ON COLUMN google_ads_reports.data IS 'Report data in JSONB format for flexibility';

COMMENT ON TABLE google_ads_api_usage IS 'Track API calls for rate limiting (100 requests/day per customer)';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON google_ads_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON google_ads_reports TO authenticated;
GRANT SELECT, INSERT ON google_ads_api_usage TO authenticated;

GRANT ALL ON google_ads_accounts TO service_role;
GRANT ALL ON google_ads_reports TO service_role;
GRANT ALL ON google_ads_api_usage TO service_role;

