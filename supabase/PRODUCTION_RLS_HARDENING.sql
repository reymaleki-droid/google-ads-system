-- PRODUCTION RLS HARDENING
-- Run this in Supabase SQL Editor AFTER initial deployment
-- Last updated: 2025-01-23

-- ========================================
-- LEADS TABLE: Restrict anonymous to INSERT only
-- ========================================

-- Drop existing anon policies (if any)
DROP POLICY IF EXISTS "public_insert_leads" ON leads;
DROP POLICY IF EXISTS "public_read_own_leads" ON leads;
DROP POLICY IF EXISTS "anon_select_leads" ON leads;
DROP POLICY IF EXISTS "anon_update_leads" ON leads;
DROP POLICY IF EXISTS "anon_delete_leads" ON leads;

-- Recreate STRICT policy: anon can ONLY INSERT with consent=true
CREATE POLICY "anon_insert_leads_only" ON leads
  FOR INSERT 
  TO anon
  WITH CHECK (consent = true);

-- Block all other operations for anon
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
-- BOOKINGS TABLE: Restrict anonymous to INSERT only
-- ========================================

-- Drop existing anon policies (if any)
DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "public_read_own_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;

-- Recreate STRICT policy: anon can ONLY INSERT
CREATE POLICY "anon_insert_bookings_only" ON bookings
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Block all other operations for anon
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
-- GOOGLE_TOKENS TABLE: Block all anonymous access
-- ========================================

-- Drop existing anon policies (if any)
DROP POLICY IF EXISTS "anon_insert_google_tokens" ON google_tokens;
DROP POLICY IF EXISTS "anon_select_google_tokens" ON google_tokens;
DROP POLICY IF EXISTS "anon_update_google_tokens" ON google_tokens;
DROP POLICY IF EXISTS "anon_delete_google_tokens" ON google_tokens;

-- Block ALL anonymous access to google_tokens
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

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('leads', 'bookings', 'google_tokens');
-- Expected: rowsecurity = true for all

-- Verify policies exist
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('leads', 'bookings', 'google_tokens')
ORDER BY tablename, policyname;

-- Test as anon (should fail for SELECT)
SET ROLE anon;
SELECT COUNT(*) FROM leads; -- Should return 0 or error
SELECT COUNT(*) FROM bookings; -- Should return 0 or error
SELECT COUNT(*) FROM google_tokens; -- Should return 0 or error
RESET ROLE;

-- ========================================
-- NOTES
-- ========================================
-- 1. service_role key bypasses ALL RLS (used by API routes)
-- 2. anon key respects RLS (used by frontend for public endpoints)
-- 3. These policies prevent direct Supabase client access from browser console
-- 4. API routes use service_role for UPDATE/DELETE operations
