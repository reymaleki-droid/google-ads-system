-- ================================================================
-- NUCLEAR OPTION: Completely Disable RLS
-- ================================================================
-- This will allow ALL operations on leads and bookings tables
-- Run this in Supabase SQL Editor if SERVICE_ROLE_KEY isn't working
-- ================================================================

-- Disable RLS entirely on leads table
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Disable RLS entirely on bookings table  
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('leads', 'bookings');

-- ================================================================
-- Expected output: rowsecurity = false for both tables
-- ================================================================
