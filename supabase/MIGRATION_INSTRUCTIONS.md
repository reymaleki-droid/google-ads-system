# Database Migration Instructions

## Migration 002: Add Booking Timezone Fields

To apply this migration, run the following SQL in your Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql
2. Copy and paste the SQL from `supabase/migrations/002_add_booking_timezone.sql`
3. Click "Run" to execute

Alternatively, run these commands individually:

```sql
-- Add booking_timezone column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_timezone TEXT DEFAULT 'Asia/Dubai';

-- Add local_start_display column  
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS local_start_display TEXT;

-- Update existing rows
UPDATE bookings SET booking_timezone = 'Asia/Dubai' WHERE booking_timezone IS NULL;

-- Rename old timezone column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='timezone') THEN
    ALTER TABLE bookings RENAME COLUMN timezone TO old_timezone;
  END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_bookings_timezone ON bookings(booking_timezone);
```

## Quick One-Liner (if you have psql access):

```bash
psql postgres://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres < supabase/migrations/002_add_booking_timezone.sql
```

## Verification

After running the migration, verify with:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('booking_timezone', 'local_start_display');
```
