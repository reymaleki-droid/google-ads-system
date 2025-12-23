-- STEP 1: Remove time-window SELECT policies
-- Execute this first

DROP POLICY IF EXISTS "anon_select_own_inserted_leads" ON leads;
DROP POLICY IF EXISTS "anon_allow_select_own_leads" ON leads;

DROP POLICY IF EXISTS "anon_select_own_inserted_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_allow_select_own_bookings" ON bookings;

-- STEP 2: Create blocking SELECT policies
CREATE POLICY "anon_no_select_leads"
  ON leads FOR SELECT TO anon
  USING (false);

CREATE POLICY "anon_no_select_bookings"
  ON bookings FOR SELECT TO anon
  USING (false);

-- STEP 3: Verify all policies (copy output)
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN qual::text = 'false' THEN 'BLOCKED'
    WHEN qual::text = 'true' THEN 'ALLOWED'
    ELSE qual::text
  END as policy_status
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
ORDER BY tablename, cmd, policyname;

-- STEP 4: Verify NO anon SELECT exists (must return 0 rows)
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
  AND cmd = 'SELECT'
  AND 'anon' = ANY(roles);

-- STEP 5: Verify table grants
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('leads', 'bookings')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
