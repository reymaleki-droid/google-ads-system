-- Migration: Add timezone fields to bookings table
-- Created: 2025-12-23
-- Purpose: Store booking timezone and local time display for accurate time rendering

-- Add booking_timezone column (defaults to Asia/Dubai)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_timezone TEXT DEFAULT 'Asia/Dubai';

-- Add local_start_display column for storing human-readable local time
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS local_start_display TEXT;

-- Update existing rows to have timezone
UPDATE bookings 
SET booking_timezone = 'Asia/Dubai' 
WHERE booking_timezone IS NULL;

-- Rename old timezone column to avoid conflicts (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='timezone'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN timezone TO old_timezone;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN bookings.booking_timezone IS 'IANA timezone identifier (e.g., Asia/Dubai) for the booking';
COMMENT ON COLUMN bookings.local_start_display IS 'Human-readable start time in booking timezone for emails and display';

-- Create index on booking_timezone for queries
CREATE INDEX IF NOT EXISTS idx_bookings_timezone ON bookings(booking_timezone);
