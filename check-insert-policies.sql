-- Check INSERT policy WITH CHECK clauses
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
  AND cmd = 'INSERT'
ORDER BY tablename;
