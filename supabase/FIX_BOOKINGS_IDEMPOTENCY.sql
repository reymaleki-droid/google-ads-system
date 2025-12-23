-- QUICK FIX: Add missing idempotency_key column to bookings
-- Run this in Supabase SQL Editor

-- Add idempotency_key column (nullable to allow existing records)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add unique index for idempotency_key (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency 
  ON bookings(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'idempotency_key';
