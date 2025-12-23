-- Quick Migration: Add timezone columns to bookings table
-- Copy this entire block and run in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql

-- Step 1: Add booking_timezone column (stores IANA timezone like 'Asia/Dubai')
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_timezone TEXT DEFAULT 'Asia/Dubai';

-- Step 2: Add local_start_display column (stores human-readable time string)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS local_start_display TEXT;

-- Step 3: Update existing bookings to have timezone
UPDATE bookings 
SET booking_timezone = 'Asia/Dubai' 
WHERE booking_timezone IS NULL;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_timezone ON bookings(booking_timezone);

-- Verify columns were created
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('booking_timezone', 'local_start_display')
ORDER BY column_name;
