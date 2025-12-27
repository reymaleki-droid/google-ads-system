-- Migration 007: Customer Google Ads Accounts
-- Purpose: Store customer-specific Google Ads OAuth tokens for read-only reporting access
-- Date: December 27, 2025

-- 1. Create customer_google_ads_accounts table
CREATE TABLE IF NOT EXISTS customer_google_ads_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google Ads Account Info
  google_ads_customer_id TEXT NOT NULL,
  
  -- OAuth Tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  
  -- Account Metadata
  account_name TEXT,
  currency_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disconnected')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(customer_id) -- One Google Ads account per customer
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_google_ads_customer_id 
  ON customer_google_ads_accounts(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_google_ads_expires_at 
  ON customer_google_ads_accounts(expires_at) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_customer_google_ads_status 
  ON customer_google_ads_accounts(status);

-- 3. Row Level Security (RLS) policies
ALTER TABLE customer_google_ads_accounts ENABLE ROW LEVEL SECURITY;

-- Customers can only access their own Google Ads connections
CREATE POLICY "Customers can view their own Google Ads account"
  ON customer_google_ads_accounts
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert their own Google Ads account"
  ON customer_google_ads_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own Google Ads account"
  ON customer_google_ads_accounts
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete their own Google Ads account"
  ON customer_google_ads_accounts
  FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- Service role has full access (for admin operations)
CREATE POLICY "Service role has full access to customer_google_ads_accounts"
  ON customer_google_ads_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_google_ads_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_google_ads_accounts_updated_at
  BEFORE UPDATE ON customer_google_ads_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_google_ads_accounts_updated_at();

-- 5. Comments for documentation
COMMENT ON TABLE customer_google_ads_accounts IS 'Customer-specific Google Ads OAuth tokens for read-only reporting access';
COMMENT ON COLUMN customer_google_ads_accounts.customer_id IS 'Reference to auth.users - customer who owns this connection';
COMMENT ON COLUMN customer_google_ads_accounts.google_ads_customer_id IS 'Google Ads Customer ID (format: 123-456-7890)';
COMMENT ON COLUMN customer_google_ads_accounts.access_token IS 'OAuth access token (short-lived, auto-refreshed)';
COMMENT ON COLUMN customer_google_ads_accounts.refresh_token IS 'OAuth refresh token (long-lived, used to get new access tokens)';
COMMENT ON COLUMN customer_google_ads_accounts.expires_at IS 'Access token expiration timestamp';
COMMENT ON COLUMN customer_google_ads_accounts.status IS 'Connection status: active, inactive, disconnected';

-- 6. Verification queries (run after migration)
-- Check table exists:
-- SELECT * FROM customer_google_ads_accounts LIMIT 1;

-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'customer_google_ads_accounts';

-- Check RLS policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'customer_google_ads_accounts';

