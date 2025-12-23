-- Add service_role bypass policies for leads and bookings
-- This allows service_role to bypass RLS completely

-- Service role bypass for leads
DROP POLICY IF EXISTS "Service role can manage leads" ON leads;
CREATE POLICY "Service role can manage leads"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role bypass for bookings
DROP POLICY IF EXISTS "Service role can manage bookings" ON bookings;
CREATE POLICY "Service role can manage bookings"
  ON bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify all policies now
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  CASE WHEN qual IS NULL THEN 'null' WHEN qual::text = 'true' THEN 'true' WHEN qual::text = 'false' THEN 'false' ELSE qual::text END as qual,
  CASE WHEN with_check IS NULL THEN 'null' WHEN with_check::text = 'true' THEN 'true' WHEN with_check::text = 'false' THEN 'false' ELSE with_check::text END as with_check
FROM pg_policies
WHERE tablename IN ('leads', 'bookings', 'google_tokens')
ORDER BY tablename, cmd, policyname;
