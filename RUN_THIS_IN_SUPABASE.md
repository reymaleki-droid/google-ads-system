# 🚀 QUICK START: Enable OTP Phone Verification

## Step 1: Apply Database Migration

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new

2. **Copy & Paste:**
   - Open file: `supabase/APPLY_OTP_MIGRATION_NOW.sql`
   - Copy entire contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor

3. **Run Query:**
   - Click "Run" button
   - Wait for completion (should take ~2 seconds)

4. **Verify Success:**
   - You should see output like:
   ```
   ============================================
   OTP MIGRATION VERIFICATION REPORT
   ============================================
   phone_verifications table: ✅ EXISTS
   leads.phone_verified_at column: ✅ EXISTS
   Indexes created: 6 (expected: 6)
   RLS policies: 2 (expected: 2)
   ============================================
   ✅ OTP PHONE VERIFICATION SETUP COMPLETE!
   ```

---

## Step 2: Test the OTP Flow

### Local Testing (Development Mode)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** http://localhost:3000/free-audit

3. **Fill form:**
   - Name: Test User
   - Email: test@example.com
   - Phone: +14155552671 (E.164 format)
   - Complete rest of form

4. **Submit & go to schedule page**

5. **Select time slot & click "Confirm Booking"**
   - OTP Modal should appear
   - Check terminal for OTP code:
   ```
   [Development Mode] OTP sent to +14155552671
   OTP Code: 123456
   ```

6. **Enter the 6-digit code**
   - Should verify successfully
   - Booking should complete
   - Redirects to thank-you page

---

## Step 3: Check Data in Supabase

### Query 1: Check if phone_verifications table exists
```sql
SELECT * FROM phone_verifications LIMIT 5;
```

### Query 2: Check if leads have phone_verified_at column
```sql
SELECT 
  id, 
  full_name, 
  phone_e164,
  phone_verified_at,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 5;
```

### Query 3: Check OTP verification records
```sql
SELECT 
  id,
  lead_id,
  status,
  attempts,
  expires_at,
  verified_at,
  created_at
FROM phone_verifications
ORDER BY created_at DESC
LIMIT 10;
```

---

## Configuration Options

### Current Settings (.env.local)

```bash
SMS_PROVIDER=mock                    # Logs OTP to console (no real SMS)
ENFORCE_PHONE_VERIFICATION=true      # Requires OTP before booking
```

### To Enable Real SMS (Production)

**Option A: Twilio**
```bash
SMS_PROVIDER=twilio_sms
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Option B: AWS SNS**
```bash
SMS_PROVIDER=aws_sns
AWS_ACCESS_KEY_ID=AKIAxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxx
AWS_REGION=us-east-1
```

---

## Troubleshooting

### OTP Modal doesn't appear
- Check: `ENFORCE_PHONE_VERIFICATION=true` in `.env.local`
- Restart dev server: `npm run dev`

### "Verification record not found" error
- Migration not applied
- Run SQL file: `supabase/APPLY_OTP_MIGRATION_NOW.sql`

### OTP code doesn't work
- Check terminal for logged code (mock mode)
- Code expires in 5 minutes
- Max 3 attempts before lockout

### Can't find OTP in terminal
- Make sure `SMS_PROVIDER=mock` (not twilio/aws)
- Check for log line: `[Development Mode] OTP Code: 123456`

---

## Success Indicators

✅ Migration applied successfully (verification report shows all green)
✅ OTP modal appears when confirming booking
✅ OTP code logged to terminal (mock mode)
✅ Code verification works
✅ `phone_verified_at` timestamp saved to lead record
✅ Booking proceeds after successful verification

---

**Ready to test!** 🎉
