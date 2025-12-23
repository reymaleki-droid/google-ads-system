-- Check current policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('leads', 'bookings')
ORDER BY tablename, policyname;
