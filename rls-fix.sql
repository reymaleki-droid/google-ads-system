-- Fix: Allow anon INSERT without checking consent in WITH CHECK
-- (consent validation happens in application layer)
DROP POLICY IF EXISTS "anon_insert_leads_only" ON leads;
CREATE POLICY "anon_insert_leads_only" ON leads
  FOR INSERT 
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_bookings_only" ON bookings;
CREATE POLICY "anon_insert_bookings_only" ON bookings
  FOR INSERT 
  TO anon
  WITH CHECK (true);
