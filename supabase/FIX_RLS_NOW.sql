-- ================================================================
-- QUICK FIX: RLS Policies for Leads Table
-- ================================================================
-- Copy this entire file and run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new
-- ================================================================

-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 1: Drop ALL existing policies using dynamic SQL
-- ========================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'leads') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON leads';
  END LOOP;
END $$;

-- ========================================
-- STEP 2: LEADS TABLE POLICIES
-- ========================================

-- Allow anonymous users to INSERT leads (NO restrictions on consent)
CREATE POLICY "allow_anon_insert_leads" ON leads
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Block anonymous SELECT (no reading lead data)
CREATE POLICY "block_anon_select" ON leads
  FOR SELECT 
  TO anon
  USING (false);

-- Block anonymous UPDATE
CREATE POLICY "block_anon_update" ON leads
  FOR UPDATE 
  TO anon
  USING (false);

-- Block anonymous DELETE
CREATE POLICY "block_anon_delete" ON leads
  FOR DELETE 
  TO anon
  USING (false);

-- ========================================
-- STEP 3: BOOKINGS TABLE POLICIES
-- ========================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing booking policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON bookings';
  END LOOP;
END $$;

-- Allow anonymous users to INSERT bookings (NO restrictions)
CREATE POLICY "allow_anon_insert_bookings" ON bookings
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Block anonymous SELECT
CREATE POLICY "block_anon_select_bookings" ON bookings
  FOR SELECT 
  TO anon
  USING (false);

-- Block anonymous UPDATE
CREATE POLICY "block_anon_update_bookings" ON bookings
  FOR UPDATE 
  TO anon
  USING (false);

-- Block anonymous DELETE
CREATE POLICY "block_anon_delete_bookings" ON bookings
  FOR DELETE 
  TO anon
  USING (false);

-- ================================================================
-- DONE! Try submitting the form again after running this.
-- ================================================================
