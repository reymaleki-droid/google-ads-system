-- Google Ads Management System - Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contact Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  
  -- Business Information
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  city TEXT,
  
  -- Campaign Information
  goal_primary TEXT NOT NULL,
  monthly_budget_range TEXT NOT NULL,
  timeline TEXT NOT NULL,
  
  -- Qualification
  response_within_5_min BOOLEAN NOT NULL DEFAULT false,
  decision_maker BOOLEAN NOT NULL DEFAULT false,
  consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Scoring & Recommendation
  lead_score INTEGER NOT NULL,
  lead_grade TEXT NOT NULL CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  recommended_package TEXT NOT NULL CHECK (recommended_package IN ('starter', 'growth', 'scale')),
  
  -- Management
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'unqualified')),
  raw_answers JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_grade ON leads(lead_grade);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public INSERT only when consent is true
CREATE POLICY "public_insert_leads" ON leads
  FOR INSERT 
  TO anon
  WITH CHECK (consent = true);

-- Policy: Allow public to read their own lead (by email) - optional
-- Uncomment if you want users to see their submission
-- CREATE POLICY "public_read_own_leads" ON leads
--   FOR SELECT
--   TO anon
--   USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- TODO: Admin access policies
-- When you implement authentication for admin users, add these policies:
-- 
-- CREATE POLICY "admin_read_all_leads" ON leads
--   FOR SELECT
--   TO authenticated
--   USING (auth.role() = 'admin');
--
-- CREATE POLICY "admin_update_leads" ON leads
--   FOR UPDATE
--   TO authenticated
--   USING (auth.role() = 'admin')
--   WITH CHECK (auth.role() = 'admin');
--
-- Note: For now, admin dashboard works via API routes with Basic Auth

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON leads TO anon;

-- Verify the table was created
-- You can run this to check:
-- SELECT * FROM leads LIMIT 1;
