-- Migration: Add missing columns to leads table
-- Run this in your Supabase SQL Editor

ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS phone_country TEXT,
  ADD COLUMN IF NOT EXISTS phone_calling_code TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_same_as_phone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_country TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_calling_code TEXT,
  ADD COLUMN IF NOT EXISTS industry_other TEXT,
  ADD COLUMN IF NOT EXISTS budget_currency TEXT CHECK (budget_currency IN ('AED', 'USD')),
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS location_area TEXT;

-- Update phone column to be nullable since we're using phone_e164 now
ALTER TABLE leads ALTER COLUMN phone DROP NOT NULL;
