-- Try different WITH CHECK expressions for PostgREST compatibility

-- Drop existing INSERT policies
DROP POLICY IF EXISTS anon_insert_leads_only ON leads;
DROP POLICY IF EXISTS anon_insert_bookings_only ON bookings;

-- Create INSERT policies with explicit TRUE boolean (not just true)
CREATE POLICY anon_insert_leads_only
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (TRUE);

CREATE POLICY anon_insert_bookings_only
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- Alternative: Try 1=1 (always true expression)
-- DROP POLICY IF EXISTS anon_insert_leads_only ON leads;
-- CREATE POLICY anon_insert_leads_only
--   ON leads
--   FOR INSERT
--   TO anon
--   WITH CHECK (1=1);

-- Verify
SELECT tablename, policyname, roles, cmd, with_check
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
  AND policyname LIKE '%insert%'
ORDER BY tablename;
