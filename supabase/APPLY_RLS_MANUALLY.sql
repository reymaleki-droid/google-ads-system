-- ================================================================
-- APPLY THESE POLICIES MANUALLY IN SUPABASE SQL EDITOR
-- Project: pidopvklxjmmlfutkrhd.supabase.co
-- ================================================================

-- ========================================
-- LEADS TABLE: Restrict anon to INSERT only
-- ========================================

DROP POLICY IF EXISTS "public_insert_leads" ON leads;
DROP POLICY IF EXISTS "public_read_own_leads" ON leads;
DROP POLICY IF EXISTS "anon_select_leads" ON leads;
DROP POLICY IF EXISTS "anon_update_leads" ON leads;
DROP POLICY IF EXISTS "anon_delete_leads" ON leads;

CREATE POLICY "anon_insert_leads_only" ON leads
  FOR INSERT 
  TO anon
  WITH CHECK (consent = true);

CREATE POLICY "anon_no_select_leads" ON leads
  FOR SELECT 
  TO anon
  USING (false);

CREATE POLICY "anon_no_update_leads" ON leads
  FOR UPDATE 
  TO anon
  USING (false);

CREATE POLICY "anon_no_delete_leads" ON leads
  FOR DELETE 
  TO anon
  USING (false);

-- ========================================
-- BOOKINGS TABLE: Restrict anon to INSERT only
-- ========================================

DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "public_read_own_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;

CREATE POLICY "anon_insert_bookings_only" ON bookings
  FOR INSERT 
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_no_select_bookings" ON bookings
  FOR SELECT 
  TO anon
  USING (false);

CREATE POLICY "anon_no_update_bookings" ON bookings
  FOR UPDATE 
  TO anon
  USING (false);

CREATE POLICY "anon_no_delete_bookings" ON bookings
  FOR DELETE 
  TO anon
  USING (false);

-- ========================================
-- GOOGLE_TOKENS TABLE: Block all anon access
-- ========================================

DROP POLICY IF EXISTS "anon_insert_google_tokens" ON google_tokens;
DROP POLICY IF EXISTS "anon_select_google_tokens" ON google_tokens;
DROP POLICY IF EXISTS "anon_update_google_tokens" ON google_tokens;
DROP POLICY IF EXISTS "anon_delete_google_tokens" ON google_tokens;

CREATE POLICY "anon_no_insert_google_tokens" ON google_tokens
  FOR INSERT 
  TO anon
  WITH CHECK (false);

CREATE POLICY "anon_no_select_google_tokens" ON google_tokens
  FOR SELECT 
  TO anon
  USING (false);

CREATE POLICY "anon_no_update_google_tokens" ON google_tokens
  FOR UPDATE 
  TO anon
  USING (false);

CREATE POLICY "anon_no_delete_google_tokens" ON google_tokens
  FOR DELETE 
  TO anon
  USING (false);
