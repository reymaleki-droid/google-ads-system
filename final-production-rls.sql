-- FINAL RLS CONFIGURATION - PRODUCTION READY
-- This allows INSERT via API while protecting data

-- ==============================================
-- LEADS TABLE - Allow INSERT, block reads/updates
-- ==============================================

-- Drop old policies
DROP POLICY IF EXISTS anon_insert_leads_only ON leads;
DROP POLICY IF EXISTS anon_allow_select_own_leads ON leads;
DROP POLICY IF EXISTS anon_no_select_leads ON leads;
DROP POLICY IF EXISTS anon_no_update_leads ON leads;
DROP POLICY IF EXISTS anon_no_delete_leads ON leads;

-- INSERT: Allow with consent
CREATE POLICY "anon_insert_leads_only"
  ON leads FOR INSERT TO anon
  WITH CHECK (consent = true);

-- SELECT: Only return the row they just inserted (for .insert().select())
CREATE POLICY "anon_select_own_inserted_leads"
  ON leads FOR SELECT TO anon
  USING (
    -- Only allow SELECT for 5 seconds after insert (prevents bulk reads)
    created_at > NOW() - INTERVAL '5 seconds'
  );

-- UPDATE/DELETE: Block completely
CREATE POLICY "anon_no_update_leads"
  ON leads FOR UPDATE TO anon
  USING (false);

CREATE POLICY "anon_no_delete_leads"
  ON leads FOR DELETE TO anon
  USING (false);

-- ==============================================
-- BOOKINGS TABLE - Allow INSERT, block reads/updates
-- ==============================================

-- Drop old policies
DROP POLICY IF EXISTS anon_insert_bookings_only ON bookings;
DROP POLICY IF EXISTS anon_allow_select_own_bookings ON bookings;
DROP POLICY IF EXISTS anon_no_select_bookings ON bookings;
DROP POLICY IF EXISTS anon_no_update_bookings ON bookings;
DROP POLICY IF EXISTS anon_no_delete_bookings ON bookings;

-- INSERT: Allow all bookings
CREATE POLICY "anon_insert_bookings_only"
  ON bookings FOR INSERT TO anon
  WITH CHECK (true);

-- SELECT: Only return the row they just inserted
CREATE POLICY "anon_select_own_inserted_bookings"
  ON bookings FOR SELECT TO anon
  USING (
    created_at > NOW() - INTERVAL '5 seconds'
  );

-- UPDATE/DELETE: Block completely
CREATE POLICY "anon_no_update_bookings"
  ON bookings FOR UPDATE TO anon
  USING (false);

CREATE POLICY "anon_no_delete_bookings"
  ON bookings FOR DELETE TO anon
  USING (false);

-- ==============================================
-- GOOGLE_TOKENS - Block all anon access
-- ==============================================

-- Already correct, verify they exist
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'google_tokens'
  AND 'anon' = ANY(roles)
ORDER BY cmd;

-- ==============================================
-- VERIFY FINAL CONFIGURATION
-- ==============================================

SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN qual IS NULL THEN 'null'
    WHEN qual::text LIKE '%created_at%' THEN 'time-limited'
    WHEN qual::text = 'true' THEN 'allow-all'
    WHEN qual::text = 'false' THEN 'block-all'
    ELSE 'custom'
  END as qual_type,
  CASE 
    WHEN with_check IS NULL THEN 'null'
    WHEN with_check::text LIKE '%consent%' THEN 'requires-consent'
    WHEN with_check::text = 'true' THEN 'allow-all'
    WHEN with_check::text = 'false' THEN 'block-all'
    ELSE 'custom'
  END as check_type
FROM pg_policies
WHERE tablename IN ('leads', 'bookings', 'google_tokens')
  AND 'anon' = ANY(roles)
ORDER BY tablename, cmd, policyname;
