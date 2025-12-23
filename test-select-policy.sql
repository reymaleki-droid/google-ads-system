-- Check if SELECT policies are blocking INSERT (PostgREST quirk)
-- In PostgreSQL, when you do INSERT...RETURNING, the RETURNING part needs SELECT permission

-- Temporarily make SELECT policy permissive for testing
DROP POLICY IF EXISTS anon_no_select_leads ON leads;
CREATE POLICY anon_allow_select_own_leads
  ON leads
  FOR SELECT
  TO anon
  USING (true);  -- Allow all for now to test

DROP POLICY IF EXISTS anon_no_select_bookings ON bookings;
CREATE POLICY anon_allow_select_own_bookings
  ON bookings
  FOR SELECT
  TO anon
  USING (true);  -- Allow all for now to test

-- Verify policies
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
  AND 'anon' = ANY(roles)
ORDER BY tablename, cmd;
