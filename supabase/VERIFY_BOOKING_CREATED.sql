-- Verify the booking was created successfully
-- Booking ID: 61f16c34-d777-477a-992b-403dbc05f75b

SELECT 
  id,
  lead_id,
  selected_start AS "UTC Start Time",
  selected_end AS "UTC End Time",
  booking_timezone AS "Timezone",
  local_start_display AS "Display Time (Client Sent)",
  status,
  created_at,
  idempotency_key
FROM bookings
WHERE id = '61f16c34-d777-477a-992b-403dbc05f75b';

-- Also verify the lead has phone verified
SELECT 
  id,
  full_name,
  phone_e164,
  phone_verified_at,
  created_at
FROM leads
WHERE id = 'ea90e022-4079-4b56-8402-864f5fb5c428';
