-- Migration 007: Authentication System & Multi-Tenancy Foundation
-- Purpose: Add Supabase Auth integration and user roles
-- Dependencies: All existing tables (leads, bookings, etc.)

-- ============================================================================
-- PART 1: USER ROLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one role per user
  UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ============================================================================
-- PART 2: ADD customer_id TO EXISTING TABLES
-- ============================================================================

-- Leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);

-- Bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);

-- Google Ads tables
ALTER TABLE google_ads_tokens 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_google_ads_tokens_customer_id ON google_ads_tokens(customer_id);

ALTER TABLE google_ads_accounts 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_customer_id ON google_ads_accounts(customer_id);

ALTER TABLE google_ads_campaigns 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_customer_id ON google_ads_campaigns(customer_id);

-- Attribution tables
ALTER TABLE attribution_events 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_attribution_events_customer_id ON attribution_events(customer_id);

-- Phone verifications (via lead_id foreign key)
-- No customer_id needed - linked via leads table

-- ============================================================================
-- PART 3: UPDATE RLS POLICIES FOR MULTI-TENANCY
-- ============================================================================

-- ========================================
-- LEADS TABLE POLICIES
-- ========================================

-- Drop old policies
DROP POLICY IF EXISTS "allow_anon_insert_leads" ON leads;
DROP POLICY IF EXISTS "block_anon_select" ON leads;
DROP POLICY IF EXISTS "block_anon_update" ON leads;
DROP POLICY IF EXISTS "block_anon_delete" ON leads;
DROP POLICY IF EXISTS "anon_insert_leads_only" ON leads;
DROP POLICY IF EXISTS "anon_no_select_leads" ON leads;
DROP POLICY IF EXISTS "anon_no_update_leads" ON leads;
DROP POLICY IF EXISTS "anon_no_delete_leads" ON leads;
DROP POLICY IF EXISTS "service_role_can_manage_leads" ON leads;

-- New multi-tenant policies
-- Anon: INSERT only (public lead forms)
CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT TO anon
  WITH CHECK (consent = true);

-- Authenticated customers: SELECT their own leads
CREATE POLICY "customers_select_own_leads"
  ON leads FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Authenticated customers: UPDATE their own leads
CREATE POLICY "customers_update_own_leads"
  ON leads FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Admins: SELECT all leads
CREATE POLICY "admins_select_all_leads"
  ON leads FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Admins: UPDATE all leads
CREATE POLICY "admins_update_all_leads"
  ON leads FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Service role: FULL ACCESS (for background workers)
CREATE POLICY "service_role_manage_leads"
  ON leads FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- BOOKINGS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "allow_anon_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "block_anon_select_bookings" ON bookings;
DROP POLICY IF EXISTS "block_anon_update_bookings" ON bookings;
DROP POLICY IF EXISTS "block_anon_delete_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_insert_bookings_only" ON bookings;
DROP POLICY IF EXISTS "anon_no_select_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_no_update_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_no_delete_bookings" ON bookings;
DROP POLICY IF EXISTS "service_role_can_manage_bookings" ON bookings;

-- New multi-tenant policies
CREATE POLICY "anon_insert_bookings"
  ON bookings FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "customers_select_own_bookings"
  ON bookings FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "customers_update_own_bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "admins_select_all_bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "admins_update_all_bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "service_role_manage_bookings"
  ON bookings FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- GOOGLE_ADS_TOKENS POLICIES
-- ========================================

DROP POLICY IF EXISTS "anon_no_access_google_tokens" ON google_ads_tokens;
DROP POLICY IF EXISTS "service_role_manage_google_tokens" ON google_ads_tokens;

CREATE POLICY "customers_select_own_tokens"
  ON google_ads_tokens FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "customers_manage_own_tokens"
  ON google_ads_tokens FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "admins_select_all_tokens"
  ON google_ads_tokens FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "service_role_manage_tokens"
  ON google_ads_tokens FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- GOOGLE_ADS_ACCOUNTS POLICIES
-- ========================================

CREATE POLICY "customers_select_own_accounts"
  ON google_ads_accounts FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "admins_select_all_accounts"
  ON google_ads_accounts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "service_role_manage_accounts"
  ON google_ads_accounts FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- GOOGLE_ADS_CAMPAIGNS POLICIES
-- ========================================

CREATE POLICY "customers_select_own_campaigns"
  ON google_ads_campaigns FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "admins_select_all_campaigns"
  ON google_ads_campaigns FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "service_role_manage_campaigns"
  ON google_ads_campaigns FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- ATTRIBUTION_EVENTS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Service role only" ON attribution_events;

CREATE POLICY "customers_select_own_attribution"
  ON attribution_events FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "admins_select_all_attribution"
  ON attribution_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "service_role_manage_attribution"
  ON attribution_events FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 4: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is customer
CREATE OR REPLACE FUNCTION is_customer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = 'customer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at trigger for user_roles
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- ============================================================================
-- PART 5: GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON user_roles TO authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_roles IS 'User role assignments for authentication (customer or admin)';
COMMENT ON COLUMN leads.customer_id IS 'Foreign key to auth.users - identifies which customer owns this lead';
COMMENT ON COLUMN bookings.customer_id IS 'Foreign key to auth.users - identifies which customer owns this booking';
COMMENT ON COLUMN google_ads_tokens.customer_id IS 'Foreign key to auth.users - each customer connects their own Google Ads account';
COMMENT ON FUNCTION is_admin IS 'Helper function to check if user has admin role';
COMMENT ON FUNCTION is_customer IS 'Helper function to check if user has customer role';
