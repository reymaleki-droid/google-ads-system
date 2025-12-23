# OTP Phone Verification - Complete Testing Guide

## Quick Start (Local Testing)

### 1. Environment Setup

Create `.env.local` with:
```bash
SMS_PROVIDER=mock
ENFORCE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Apply Database Migration

Run in Supabase SQL Editor:
```sql
-- Copy contents from supabase/migrations/006_phone_verification.sql
-- Execute in Supabase Dashboard → SQL Editor
```

---

## Complete OTP Flow Test

### Step 1: Submit Lead Form

1. Navigate to `/free-audit`
2. Fill out form with:
   - Name: Test User
   - Email: test@example.com
   - Phone: +14155552671 (E.164 format required)
   - Website: https://example.com
3. Submit form
4. Note the `lead_id` from redirect URL

**Expected:** Redirect to `/schedule?lead_id=xxx`

---

### Step 2: Select Time Slot

1. On schedule page, select any available time slot
2. Click "Confirm Booking"

**Expected:** 
- Booking API called: `POST /api/bookings`
- Response: `403 Forbidden` with `requiresVerification: true`
- OTP Modal appears automatically

---

### Step 3: OTP Modal - Sending State

**What You See:**
```
┌──────────────────────────────────────────────┐
│ Sending Verification Code                    │
│                                              │
│ [Spinner Animation]                          │
│                                              │
│ Sending code to ***2671...                  │
└──────────────────────────────────────────────┘
```

**Backend Logs (Terminal):**
```
┌──────────────────────────────────────────────────────────┐
│ 📱 MOCK SMS PROVIDER (Testing Mode)                      │
├──────────────────────────────────────────────────────────┤
│ To: +1******2671                                         │
│ OTP Code: 123456                                         │
│ Status: ✅ Logged (No real SMS sent)                    │
└──────────────────────────────────────────────────────────┘
```

**API Response:** `POST /api/otp/send`
```json
{
  "success": true,
  "verificationId": "uuid-here",
  "expiresIn": 300,
  "phoneDisplay": "***2671"
}
```

---

### Step 4: OTP Modal - Sent State

**What You See:**
```
┌──────────────────────────────────────────────┐
│ Verify Your Phone                            │
│                                              │
│ Enter the 6-digit code sent to ***2671      │
│                                              │
│ [______] (6-digit input)                     │
│                                              │
│ Didn't receive it? Resend in 30s            │
│                                              │
│ [Skip for Now] (if allowed)                 │
└──────────────────────────────────────────────┘
```

**Action:** Enter OTP from terminal logs (e.g., `123456`)

---

### Step 5: Auto-Verify on 6th Digit

**What Happens:**
1. User types 6th digit
2. Auto-submits to `POST /api/otp/verify`
3. Modal shows "Verifying..." state

**Backend Processing:**
- Fetches verification record from `phone_verifications`
- Checks expiration (5 minutes)
- Checks max attempts (3)
- Verifies OTP via bcrypt.compare()
- Updates `phone_verifications.status = 'verified'`
- Updates `leads.phone_verified_at = NOW()`

---

### Step 6: OTP Modal - Success State

**What You See:**
```
┌──────────────────────────────────────────────┐
│                                              │
│   [✓] (Green checkmark icon)                │
│                                              │
│   Phone Verified!                           │
│                                              │
│   You'll be redirected to booking...        │
│                                              │
└──────────────────────────────────────────────┘
```

**What Happens:**
1. Success state shows for 1.5 seconds
2. Modal closes
3. Schedule page retries booking: `POST /api/bookings`
4. Booking succeeds (phone_verified_at is set)
5. Redirect to `/thank-you?booking_id=xxx`

---

## Error Scenarios

### Test 1: Wrong OTP Code

**Action:** Enter incorrect code (e.g., `000000`)

**Expected:**
```
┌──────────────────────────────────────────────┐
│ Incorrect Code                               │
│                                              │
│ The code you entered is incorrect.          │
│ 2 attempts remaining.                       │
│                                              │
│ [______] (input cleared, autofocus)         │
│                                              │
│ [Try Again]                                  │
└──────────────────────────────────────────────┘
```

**Database:** `phone_verifications.attempts` incremented

---

### Test 2: Expired OTP

**Action:** Wait 6 minutes after OTP sent, then try to verify

**Expected:**
```
┌──────────────────────────────────────────────┐
│ Code Expired                                 │
│                                              │
│ Your verification code has expired.         │
│ Request a new code to continue.             │
│                                              │
│ [Send New Code]                              │
└──────────────────────────────────────────────┘
```

**API Response:** `410 Gone` status
**Database:** `phone_verifications.status = 'expired'`

---

### Test 3: Max Attempts Exceeded

**Action:** Enter wrong code 3 times

**Expected:**
```
┌──────────────────────────────────────────────┐
│ Too Many Attempts                            │
│                                              │
│ You've exceeded the maximum number of       │
│ verification attempts. Please request a     │
│ new code.                                    │
│                                              │
│ [Send New Code]                              │
└──────────────────────────────────────────────┘
```

**API Response:** `429 Too Many Requests`
**Database:** `phone_verifications.status = 'failed'`
**Suspicious Event:** Logged to `suspicious_events` table

---

### Test 4: Rate Limit (IP)

**Action:** Request OTP 3 times within 1 minute from same IP

**Expected:**
```
┌──────────────────────────────────────────────┐
│ Please Wait                                  │
│                                              │
│ Too many verification requests.             │
│ Please wait 45 seconds before trying again. │
│                                              │
│ [Wait 45s] (disabled button)                │
└──────────────────────────────────────────────┘
```

**API Response:** `429 Too Many Requests`
```json
{
  "error": "Too many requests...",
  "resetIn": 45
}
```

---

### Test 5: Rate Limit (Phone)

**Action:** Request OTP 4 times within 15 minutes for same phone

**Expected:**
```
┌──────────────────────────────────────────────┐
│ Please Wait                                  │
│                                              │
│ Too many verification attempts for this     │
│ phone number. Please try again later.       │
│                                              │
│ [Wait] (disabled)                            │
└──────────────────────────────────────────────┘
```

**API Response:** `429 Too Many Requests`

---

### Test 6: Resend Cooldown

**Action:** Click "Resend code" immediately after OTP sent

**Expected:**
```
┌──────────────────────────────────────────────┐
│ Resend Cooldown                              │
│                                              │
│ Please wait 30 seconds before requesting    │
│ a new code.                                  │
│                                              │
│ [Back to Verification]                       │
└──────────────────────────────────────────────┘
```

**Frontend:** Resend button shows "Resend in 30s" countdown

---

## Feature Flag Testing

### Scenario A: Enforcement ENABLED

```bash
ENFORCE_PHONE_VERIFICATION=true
```

**Flow:**
1. Submit lead → Schedule page
2. Select slot → Confirm
3. **OTP modal appears** (hard gate)
4. Verify phone → Booking succeeds

**Booking API Behavior:**
```json
// If phone NOT verified:
{
  "ok": false,
  "error": "Phone verification required",
  "requiresVerification": true
}
// Status: 403 Forbidden

// If phone verified:
{
  "ok": true,
  "booking_id": "uuid-here"
}
// Status: 200 OK
```

---

### Scenario B: Enforcement DISABLED

```bash
ENFORCE_PHONE_VERIFICATION=false
```

**Flow:**
1. Submit lead → Schedule page
2. Select slot → Confirm
3. **Booking succeeds immediately** (no OTP)
4. OTP modal does NOT appear

**Booking API Behavior:**
```json
// Phone NOT verified, but allowed:
{
  "ok": true,
  "booking_id": "uuid-here"
}
// Status: 200 OK
```

**Backend Logs:**
```
[Booking] Phone NOT verified - allowing booking (enforcement disabled)
```

---

## Database Verification

### Check Phone Verification Status

```sql
-- Find lead and check verification
SELECT 
  id,
  full_name,
  phone,
  phone_verified_at,
  created_at
FROM leads
WHERE email = 'test@example.com';
```

**Expected:**
- `phone_verified_at` should be NULL before OTP verification
- `phone_verified_at` should have timestamp after successful verification

---

### Check OTP Records

```sql
-- Find OTP verification records
SELECT 
  id,
  lead_id,
  status,
  attempts,
  expires_at,
  verified_at,
  created_at
FROM phone_verifications
WHERE lead_id = 'uuid-from-above'
ORDER BY created_at DESC;
```

**Expected Fields:**
- `status`: 'pending', 'verified', 'expired', or 'failed'
- `attempts`: Number of verification attempts (0-3)
- `expires_at`: 5 minutes after creation
- `verified_at`: Timestamp when verified (NULL if not verified)

---

### Check Suspicious Events

```sql
-- Check for suspicious activity
SELECT 
  event_type,
  severity,
  ip_address,
  metadata,
  created_at
FROM suspicious_events
WHERE event_type LIKE 'otp_%'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Event Types:**
- `otp_rate_limit_ip` - IP exceeded rate limit
- `otp_rate_limit_phone` - Phone exceeded rate limit
- `otp_max_attempts` - User exhausted all attempts
- `otp_invalid_attempt` - Wrong code submitted
- `otp_phone_mismatch` - Phone doesn't match lead

---

## API Endpoint Testing

### 1. Send OTP

```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "uuid-here",
    "phoneNumber": "+14155552671"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "verificationId": "uuid-here",
  "expiresIn": 300,
  "phoneDisplay": "***2671"
}
```

**Error Response (429):**
```json
{
  "error": "Too many requests. Please wait before requesting another code.",
  "resetIn": 45
}
```

---

### 2. Verify OTP

```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "uuid-here",
    "otp": "123456"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "verified": true,
  "leadId": "uuid-here"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid verification code",
  "remainingAttempts": 2
}
```

---

### 3. Create Booking (Gated)

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "uuid-here",
    "booking_start_utc": "2025-12-24T09:00:00.000Z",
    "booking_end_utc": "2025-12-24T09:15:00.000Z",
    "booking_timezone": "Asia/Dubai"
  }'
```

**Success Response (200):**
```json
{
  "ok": true,
  "booking_id": "uuid-here"
}
```

**Blocked Response (403) - Phone Not Verified:**
```json
{
  "ok": false,
  "error": "Phone verification required",
  "requiresVerification": true
}
```

---

## Troubleshooting

### OTP Not Appearing in Console

**Check:**
1. Terminal running `npm run dev`
2. `SMS_PROVIDER=mock` in `.env.local`
3. Look for box drawing characters (┌──┐)

**Expected Output:**
```
┌──────────────────────────────────────────────────────────┐
│ 📱 MOCK SMS PROVIDER (Testing Mode)                      │
├──────────────────────────────────────────────────────────┤
│ To: +1******2671                                         │
│ OTP Code: 123456                                         │
│ Status: ✅ Logged (No real SMS sent)                    │
└──────────────────────────────────────────────────────────┘
```

---

### OTP Modal Not Appearing

**Check:**
1. `ENFORCE_PHONE_VERIFICATION=true` in `.env.local`
2. Browser console for errors
3. Network tab: `/api/bookings` returns `403` status

**Debug:**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Reload page
```

---

### Phone Already Verified Message

**Issue:** Modal shows "Phone already verified" immediately

**Cause:** Previous test left `phone_verified_at` set

**Fix:**
```sql
-- Reset verification status
UPDATE leads 
SET phone_verified_at = NULL 
WHERE email = 'test@example.com';
```

---

### Booking Succeeds Without OTP

**Check:**
1. `ENFORCE_PHONE_VERIFICATION=true` (not 'false')
2. Environment variable loaded: `process.env.ENFORCE_PHONE_VERIFICATION`
3. Restart dev server after changing `.env.local`

**Verify:**
```bash
# Check if env var is loaded
node -e "console.log(process.env.ENFORCE_PHONE_VERIFICATION)"
# Should print: true
```

---

## Complete Test Checklist

### Happy Path
- [ ] Lead submission successful
- [ ] Schedule page loads with slots
- [ ] Select slot and confirm
- [ ] OTP modal appears (if enforcement enabled)
- [ ] Mock OTP logged to console
- [ ] Enter OTP code
- [ ] Auto-verify on 6th digit
- [ ] Success state shows
- [ ] Booking created successfully
- [ ] Redirect to thank-you page
- [ ] `phone_verified_at` set in database

### Error Handling
- [ ] Wrong code shows error with retry
- [ ] Expired code shows "Send New Code"
- [ ] Max attempts shows locked state
- [ ] IP rate limit blocks requests
- [ ] Phone rate limit blocks requests
- [ ] Resend cooldown enforced (30s)
- [ ] Invalid phone format rejected
- [ ] Phone mismatch detected

### Feature Flag
- [ ] Enforcement ON: Hard gate before booking
- [ ] Enforcement OFF: Booking allowed without OTP
- [ ] Logs show verification status

### Database
- [ ] `phone_verifications` record created
- [ ] OTP hash stored (bcrypt)
- [ ] Status transitions correctly
- [ ] `phone_verified_at` updated on success
- [ ] Suspicious events logged

### API
- [ ] POST /api/otp/send returns 200
- [ ] POST /api/otp/verify returns 200
- [ ] POST /api/bookings blocks unverified (403)
- [ ] POST /api/bookings allows verified (200)

---

## Performance Benchmarks

### Expected Latencies (Local)

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Send OTP | <100ms | Mock provider (instant) |
| Verify OTP | <200ms | Includes bcrypt compare |
| Booking Creation | <500ms | Full flow with email |

### Rate Limits

| Limit Type | Threshold | Window |
|------------|-----------|--------|
| IP-based | 2 requests | 1 minute |
| Phone-based | 3 requests | 15 minutes |
| Resend cooldown | 1 request | 30 seconds |
| Max attempts | 3 attempts | Per OTP |

---

## Production Readiness

### Before Deploying

1. ✅ Database migration applied
2. ✅ Environment variables set
3. ✅ Feature flag configured
4. ✅ SMS provider tested (mock for now)
5. ✅ All tests passing
6. ✅ Error handling verified
7. ✅ Suspicious event logging active

### Deployment Steps

```bash
# 1. Set environment variables in Vercel
vercel env add SMS_PROVIDER production
# Value: mock

vercel env add ENFORCE_PHONE_VERIFICATION production
# Value: true (or false for soft launch)

# 2. Deploy
vercel --prod

# 3. Test in production
# Visit your production domain
# Complete full OTP flow
# Check Vercel logs for OTP output
```

---

**Testing Guide Complete** - December 23, 2025

**Status:** ✅ Ready for Local Testing  
**Mock Provider:** ✅ Active (no real SMS)  
**Feature Flag:** ✅ Implemented  
**Hard Gate:** ✅ Enforced (when enabled)
