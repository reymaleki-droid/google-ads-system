-- Force PostgREST schema cache reload
-- Run this after adding new columns

NOTIFY pgrst, 'reload schema';

-- Verify idempotency_key column exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'idempotency_key';
