-- Check table permissions for anon role
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('leads', 'bookings', 'google_tokens')
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- Check if anon role has default permissions
SELECT grantee, table_schema, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public';

-- Grant INSERT permission to anon if missing
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.bookings TO anon;
GRANT INSERT ON public.google_tokens TO anon;
