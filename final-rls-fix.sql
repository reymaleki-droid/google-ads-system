-- FINAL RLS FIX: Grant permissions + refresh schema

-- 1. Grant permissions to anon role (THIS WAS MISSING!)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.bookings TO anon;
GRANT INSERT ON public.google_tokens TO anon;
GRANT SELECT ON public.leads TO anon;
GRANT SELECT ON public.bookings TO anon;
GRANT SELECT ON public.google_tokens TO anon;

-- 2. Grant to authenticated role as well (for logged-in users)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.google_tokens TO authenticated;

-- 3. Verify grants
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('leads', 'bookings', 'google_tokens')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
