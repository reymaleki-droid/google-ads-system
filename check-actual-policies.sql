-- Check what policies are ACTUALLY active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('leads', 'bookings', 'google_tokens')
ORDER BY tablename, cmd, policyname;
