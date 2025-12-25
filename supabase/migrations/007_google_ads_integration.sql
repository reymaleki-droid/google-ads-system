-- Migration 007: Google Ads Integration
-- Purpose: Add tables for Google Ads OAuth, account sync, and insight caching
-- Dependencies: Existing google_tokens pattern from Google Calendar integration

-- ============================================================================
-- 1. GOOGLE ADS OAUTH TOKENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- OAuth credentials
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  
  -- Google Ads specific
  developer_token TEXT NOT NULL,
  customer_id TEXT NOT NULL, -- Without hyphens: 1234567890
  login_customer_id TEXT, -- For MCC access
  
  -- Metadata
  user_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================================
-- 2. GOOGLE ADS ACCOUNTS (CUSTOMER LIST)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Account identification
  customer_id TEXT NOT NULL UNIQUE, -- 1234567890
  customer_name TEXT,
  currency_code TEXT NOT NULL, -- USD, AED, SAR
  timezone TEXT NOT NULL, -- Asia/Dubai, America/New_York
  
  -- Account status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'removed')),
  is_manager_account BOOLEAN NOT NULL DEFAULT false,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT
);

-- ============================================================================
-- 3. GOOGLE ADS CAMPAIGNS (CACHED DATA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Campaign identification
  customer_id TEXT NOT NULL REFERENCES google_ads_accounts(customer_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL, -- 123456789
  campaign_name TEXT NOT NULL,
  
  -- Campaign settings
  status TEXT NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  advertising_channel_type TEXT, -- SEARCH, DISPLAY, VIDEO, etc.
  bidding_strategy_type TEXT,
  budget_amount_micros BIGINT, -- Amount in micros (1 USD = 1,000,000 micros)
  
  -- Performance metrics (30-day)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions DECIMAL(10, 2) DEFAULT 0,
  conversion_value_micros BIGINT DEFAULT 0,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL,
  data_start_date DATE NOT NULL, -- Start of 30-day window
  data_end_date DATE NOT NULL, -- End of 30-day window
  
  UNIQUE(customer_id, campaign_id)
);

-- ============================================================================
-- 4. GOOGLE ADS AD GROUPS (CACHED DATA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_ad_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ad group identification
  customer_id TEXT NOT NULL REFERENCES google_ads_accounts(customer_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  ad_group_id TEXT NOT NULL,
  ad_group_name TEXT NOT NULL,
  
  -- Ad group settings
  status TEXT NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  ad_group_type TEXT, -- SEARCH_STANDARD, DISPLAY_STANDARD, etc.
  
  -- Performance metrics (30-day)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions DECIMAL(10, 2) DEFAULT 0,
  conversion_value_micros BIGINT DEFAULT 0,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL,
  data_start_date DATE NOT NULL,
  data_end_date DATE NOT NULL,
  
  UNIQUE(customer_id, campaign_id, ad_group_id)
);

-- ============================================================================
-- 5. GOOGLE ADS SEARCH TERMS (CACHED DATA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_search_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Search term identification
  customer_id TEXT NOT NULL REFERENCES google_ads_accounts(customer_id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  ad_group_id TEXT NOT NULL,
  search_term TEXT NOT NULL,
  
  -- Search term metadata
  match_type TEXT, -- EXACT, PHRASE, BROAD
  keyword_text TEXT, -- Matched keyword
  
  -- Performance metrics (30-day)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions DECIMAL(10, 2) DEFAULT 0,
  conversion_value_micros BIGINT DEFAULT 0,
  
  -- Waste detection flags
  is_wasted_spend BOOLEAN DEFAULT false, -- clicks > 0 AND conversions = 0 AND cost > $50
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL,
  data_start_date DATE NOT NULL,
  data_end_date DATE NOT NULL,
  
  UNIQUE(customer_id, campaign_id, ad_group_id, search_term)
);

-- ============================================================================
-- 6. GOOGLE ADS SYNC JOBS (JOB QUEUE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_ads_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Job identification
  customer_id TEXT NOT NULL REFERENCES google_ads_accounts(customer_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_sync', 'incremental_sync', 'metrics_refresh')),
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Job results
  campaigns_synced INT DEFAULT 0,
  ad_groups_synced INT DEFAULT 0,
  search_terms_synced INT DEFAULT 0,
  error_message TEXT,
  
  -- Retry logic
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  retry_after TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- google_ads_tokens indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_tokens_customer_id ON google_ads_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_tokens_expires_at ON google_ads_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_google_ads_tokens_is_active ON google_ads_tokens(is_active) WHERE is_active = true;

-- google_ads_accounts indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_status ON google_ads_accounts(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_last_synced ON google_ads_accounts(last_synced_at);

-- google_ads_campaigns indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_customer_id ON google_ads_campaigns(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_status ON google_ads_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_cost ON google_ads_campaigns(cost_micros DESC);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_last_synced ON google_ads_campaigns(last_synced_at);

-- google_ads_ad_groups indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_customer_id ON google_ads_ad_groups(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_campaign_id ON google_ads_ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_cost ON google_ads_ad_groups(cost_micros DESC);

-- google_ads_search_terms indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_search_terms_customer_id ON google_ads_search_terms(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_search_terms_campaign_id ON google_ads_search_terms(campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_search_terms_wasted ON google_ads_search_terms(is_wasted_spend) WHERE is_wasted_spend = true;
CREATE INDEX IF NOT EXISTS idx_google_ads_search_terms_cost ON google_ads_search_terms(cost_micros DESC);

-- google_ads_sync_jobs indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_jobs_customer_id ON google_ads_sync_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_jobs_status ON google_ads_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_jobs_created_at ON google_ads_sync_jobs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE google_ads_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_search_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Service role only (anon has NO access)
CREATE POLICY "service_role_only_google_ads_tokens" ON google_ads_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only_google_ads_accounts" ON google_ads_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only_google_ads_campaigns" ON google_ads_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only_google_ads_ad_groups" ON google_ads_ad_groups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only_google_ads_search_terms" ON google_ads_search_terms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only_google_ads_sync_jobs" ON google_ads_sync_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANTS FOR SERVICE ROLE
-- ============================================================================

GRANT ALL ON google_ads_tokens TO service_role;
GRANT ALL ON google_ads_accounts TO service_role;
GRANT ALL ON google_ads_campaigns TO service_role;
GRANT ALL ON google_ads_ad_groups TO service_role;
GRANT ALL ON google_ads_search_terms TO service_role;
GRANT ALL ON google_ads_sync_jobs TO service_role;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_google_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_ads_tokens_updated_at BEFORE UPDATE ON google_ads_tokens FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();
CREATE TRIGGER google_ads_accounts_updated_at BEFORE UPDATE ON google_ads_accounts FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();
CREATE TRIGGER google_ads_campaigns_updated_at BEFORE UPDATE ON google_ads_campaigns FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();
CREATE TRIGGER google_ads_ad_groups_updated_at BEFORE UPDATE ON google_ads_ad_groups FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();
CREATE TRIGGER google_ads_search_terms_updated_at BEFORE UPDATE ON google_ads_search_terms FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();
CREATE TRIGGER google_ads_sync_jobs_updated_at BEFORE UPDATE ON google_ads_sync_jobs FOR EACH ROW EXECUTE FUNCTION update_google_ads_updated_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE google_ads_tokens IS 'OAuth2 tokens for Google Ads API access with developer token';
COMMENT ON TABLE google_ads_accounts IS 'List of connected Google Ads accounts with sync status';
COMMENT ON TABLE google_ads_campaigns IS 'Cached campaign data with 30-day performance metrics';
COMMENT ON TABLE google_ads_ad_groups IS 'Cached ad group data with 30-day performance metrics';
COMMENT ON TABLE google_ads_search_terms IS 'Cached search term data with waste detection flags';
COMMENT ON TABLE google_ads_sync_jobs IS 'Job queue for daily Google Ads data synchronization';

COMMENT ON COLUMN google_ads_campaigns.cost_micros IS 'Cost in micros (1 USD = 1,000,000 micros)';
COMMENT ON COLUMN google_ads_search_terms.is_wasted_spend IS 'Clicks > 0 AND conversions = 0 AND cost > $50';
COMMENT ON COLUMN google_ads_sync_jobs.retry_after IS 'Exponential backoff: 2min, 4min, 8min for retries';
