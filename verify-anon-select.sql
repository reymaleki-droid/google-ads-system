-- Verify current anon SELECT policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  qual::text as using_clause
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
  AND 'anon' = ANY(roles)
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
