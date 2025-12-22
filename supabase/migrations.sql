-- Migration: Add new fields for enhanced lead tracking
-- Date: 2025-12-22
-- Description: Adds phone E.164 format, WhatsApp fields, location fields, and budget currency

-- Add new phone and WhatsApp fields
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS phone_country TEXT,
  ADD COLUMN IF NOT EXISTS phone_calling_code TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_same_as_phone BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_country TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_calling_code TEXT;

-- Add new location fields (replacing city with structured location)
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city_new TEXT,
  ADD COLUMN IF NOT EXISTS location_area TEXT;

-- Add budget currency field
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'AED';

-- Optionally migrate existing city data to city_new
-- UPDATE leads SET city_new = city WHERE city_new IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_phone_e164 ON leads(phone_e164);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_city_new ON leads(city_new);
CREATE INDEX IF NOT EXISTS idx_leads_budget_currency ON leads(budget_currency);

-- Add comments for documentation
COMMENT ON COLUMN leads.phone_e164 IS 'Phone number in E.164 format (e.g., +971501234567)';
COMMENT ON COLUMN leads.phone_country IS 'Country code (e.g., AE, US, GB)';
COMMENT ON COLUMN leads.phone_calling_code IS 'Calling code with + (e.g., +971)';
COMMENT ON COLUMN leads.whatsapp_same_as_phone IS 'True if WhatsApp uses same number as phone';
COMMENT ON COLUMN leads.whatsapp_e164 IS 'WhatsApp number in E.164 format';
COMMENT ON COLUMN leads.country IS 'Country of business location';
COMMENT ON COLUMN leads.city_new IS 'City of business location';
COMMENT ON COLUMN leads.location_area IS 'Specific area/neighborhood within city';
COMMENT ON COLUMN leads.budget_currency IS 'Currency for monthly budget (AED or USD)';

-- NOTE: To fully switch from old 'city' field to 'city_new':
-- 1. Run this migration
-- 2. Update application code to use 'city_new' field name
-- 3. After verification, optionally rename: ALTER TABLE leads RENAME COLUMN city TO city_old;
-- 4. Then: ALTER TABLE leads RENAME COLUMN city_new TO city;
