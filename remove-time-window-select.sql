-- Remove time-window SELECT policies
-- Replace with NO SELECT access for anon (retrieval via signed tokens only)

-- LEADS: Remove time-limited SELECT
DROP POLICY IF EXISTS "anon_select_own_inserted_leads" ON leads;

-- LEADS: Block all anon SELECT
CREATE POLICY "anon_no_select_leads"
  ON leads FOR SELECT TO anon
  USING (false);

-- BOOKINGS: Remove time-limited SELECT
DROP POLICY IF EXISTS "anon_select_own_inserted_bookings" ON bookings;

-- BOOKINGS: Block all anon SELECT
CREATE POLICY "anon_no_select_bookings"
  ON bookings FOR SELECT TO anon
  USING (false);

-- Verify final policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN qual::text = 'false' THEN 'blocked'
    WHEN qual::text = 'true' THEN 'allowed'
    ELSE qual::text
  END as policy_effect
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
  AND 'anon' = ANY(roles)
  AND cmd = 'SELECT'
ORDER BY tablename;
