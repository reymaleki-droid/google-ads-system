# OTP Phone Verification - Deployment Guide

## Overview
This guide covers deployment of the OTP-based phone verification system for lead phone validation before booking confirmation.

## Implementation Summary

### Files Created (7)
1. `supabase/migrations/006_phone_verification.sql` - Database schema
2. `lib/sms.ts` - OTP generation, hashing, SMS utilities
3. `app/api/otp/send/route.ts` - Send OTP endpoint
4. `app/api/otp/verify/route.ts` - Verify OTP endpoint
5. `components/OTPModal.tsx` - React component with 10 UI states
6. `scripts/verify-otp.mjs` - Verification test suite (12 tests)
7. `OTP-DEPLOYMENT-GUIDE.md` - This file

### Files Modified (2)
1. `app/api/bookings/route.ts` - Added phone verification enforcement
2. `app/schedule/page.tsx` - Integrated OTP modal in booking flow

### Test Results
- ✅ 12/12 tests passed (0 failures)
- Database schema: ✅ Validated
- SMS utilities: ✅ Validated
- API endpoints: ✅ Validated
- Frontend component: ✅ Validated
- Booking enforcement: ✅ Validated

---

## Pre-Deployment Checklist

### 1. Install Dependencies
```bash
npm install bcrypt
npm install @types/bcrypt --save-dev
```

### 2. Choose SMS Provider

#### Option A: Twilio (Recommended)
1. Sign up at https://www.twilio.com/
2. Get credentials from Twilio Console:
   - Account SID
   - Auth Token
   - Phone Number (must be purchased)

#### Option B: AWS SNS
1. Create AWS account with SNS access
2. Get credentials:
   - AWS Access Key ID
   - AWS Secret Access Key
   - AWS Region

#### Option C: Development Mode
- Set `NODE_ENV=development` to log OTPs to console (no SMS sent)

### 3. Apply Database Migration

**Via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/006_phone_verification.sql`
3. Execute migration
4. Verify tables created:
   ```sql
   SELECT * FROM phone_verifications LIMIT 1;
   SELECT phone_verified_at FROM leads LIMIT 1;
   ```

**Via Supabase CLI:**
```bash
supabase db push
```

### 4. Set Environment Variables

#### Production (Vercel)
```bash
# SMS Provider Configuration (choose one)
vercel env add SMS_PROVIDER
# Value: twilio or aws-sns

# Twilio Configuration (if using Twilio)
vercel env add TWILIO_ACCOUNT_SID
# Value: AC... (from Twilio Console)

vercel env add TWILIO_AUTH_TOKEN
# Value: your_auth_token

vercel env add TWILIO_PHONE_NUMBER
# Value: +1... (your Twilio phone number in E.164 format)

# AWS SNS Configuration (if using AWS)
vercel env add AWS_ACCESS_KEY_ID
# Value: AKIA...

vercel env add AWS_SECRET_ACCESS_KEY
# Value: your_secret_key

vercel env add AWS_REGION
# Value: us-east-1 (or your preferred region)

# Feature Flag (Phase 1: Logging Only)
vercel env add ENFORCE_PHONE_VERIFICATION
# Value: false
```

#### Local Development (.env.local)
```bash
# SMS Provider
SMS_PROVIDER=twilio  # or aws-sns, or leave unset for dev mode

# Twilio (if using)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+14155552671

# AWS SNS (if using)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Feature Flag
ENFORCE_PHONE_VERIFICATION=false  # Phase 1: logging only
```

---

## Deployment Process

### Phase 1: Deploy with Logging Only (Recommended First Step)

**Goal:** Test OTP flow without blocking bookings. Collect metrics.

1. **Set Feature Flag to Disabled:**
   ```bash
   vercel env add ENFORCE_PHONE_VERIFICATION
   # Value: false
   ```

2. **Deploy to Production:**
   ```bash
   git add -A
   git commit -m "Add OTP phone verification (Phase 1: logging only)"
   vercel --prod
   ```

3. **Verify Deployment:**
   - Check Vercel build logs for errors
   - Test OTP flow manually:
     - Submit lead form
     - Navigate to schedule page
     - Select time slot → click Confirm
     - OTP modal should NOT appear (enforcement disabled)
     - Check logs for "Phone NOT verified - allowing booking"

4. **Monitor for 24-48 hours:**
   - Check structured logs for OTP-related events
   - Look for errors in SMS sending
   - Verify Twilio/AWS costs are reasonable
   - Validate phone verification rates (how many users verify)

### Phase 2: Enable Enforcement (After Phase 1 Success)

**Goal:** Require phone verification before booking.

1. **Update Feature Flag:**
   ```bash
   vercel env rm ENFORCE_PHONE_VERIFICATION production
   vercel env add ENFORCE_PHONE_VERIFICATION production
   # Value: true
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Verify Enforcement:**
   - Submit new lead
   - Navigate to schedule page
   - Select time slot → click Confirm
   - OTP modal SHOULD appear
   - Enter incorrect code → see "Invalid verification code"
   - Enter correct code → booking proceeds

4. **Gradual Rollout (Optional):**
   - Start with 10% traffic (A/B test)
   - Increase to 50% after 24 hours
   - Increase to 100% after 48 hours
   - Monitor metrics at each stage

---

## Post-Deployment Testing

### Manual Test Checklist

#### Test 1: Send OTP (Happy Path)
1. Submit lead form with valid phone (+14155552671)
2. Navigate to schedule page
3. Select time slot → Confirm
4. OTP modal appears with "Sending..." state
5. Transitions to "Sent" state with 6-digit input
6. Check phone for SMS (or console logs in dev mode)
7. ✅ Pass if SMS received within 10 seconds

#### Test 2: Verify OTP (Happy Path)
1. Enter 6-digit code from SMS
2. Modal shows "Verifying..." state
3. Transitions to "Success" state with green checkmark
4. Redirects to thank-you page after 1.5 seconds
5. ✅ Pass if booking created successfully

#### Test 3: Wrong Code
1. Enter incorrect 6-digit code
2. Modal shows "Incorrect Code" state
3. Shows "2 attempts remaining"
4. Input field clears
5. ✅ Pass if can retry with correct code

#### Test 4: Expired Code
1. Wait 6 minutes after SMS sent
2. Enter code (even if correct)
3. Modal shows "Code Expired" state
4. Click "Send New Code"
5. ✅ Pass if new SMS sent

#### Test 5: Max Attempts (Locked)
1. Enter wrong code 3 times
2. Modal shows "Too Many Attempts" state
3. Click "Send New Code"
4. ✅ Pass if new SMS sent and can verify

#### Test 6: Rate Limit (IP)
1. Request OTP 3 times within 1 minute
2. Third request shows "Please Wait" state
3. ✅ Pass if shows countdown timer

#### Test 7: Rate Limit (Phone)
1. Request OTP 4 times within 15 minutes for same phone
2. Fourth request shows error
3. ✅ Pass if blocked with clear message

#### Test 8: Resend Cooldown
1. Send OTP successfully
2. Immediately click "Resend code"
3. Shows "Resend in 30s" disabled button
4. After 30 seconds, "Resend code" becomes clickable
5. ✅ Pass if cooldown enforced

#### Test 9: Phone Mismatch
1. Submit lead with phone A
2. Try to send OTP to phone B (via API)
3. ✅ Pass if returns 403 error

#### Test 10: Already Verified
1. Verify phone once
2. Navigate back to schedule page
3. Select slot → Confirm
4. ✅ Pass if booking proceeds WITHOUT OTP modal

### API Testing (cURL Examples)

#### Send OTP
```bash
curl -X POST https://your-domain.com/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "uuid-here",
    "phoneNumber": "+14155552671"
  }'

# Expected Response (200):
{
  "success": true,
  "verificationId": "uuid-here",
  "expiresIn": 300,
  "phoneDisplay": "***2671"
}
```

#### Verify OTP
```bash
curl -X POST https://your-domain.com/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "uuid-here",
    "otp": "123456"
  }'

# Expected Response (200):
{
  "success": true,
  "verified": true,
  "leadId": "uuid-here"
}
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Conversion Rate:**
   - Leads who request OTP / Total leads
   - Leads who verify OTP / Leads who request OTP
   - Bookings created / OTP verifications

2. **Performance:**
   - OTP send latency (P50, P95, P99)
   - OTP verify latency (P50, P95, P99)
   - SMS delivery time (Twilio/AWS metrics)

3. **Security:**
   - Rate limit violations (IP-based)
   - Rate limit violations (phone-based)
   - Max attempt violations
   - Phone mismatch attempts

4. **User Experience:**
   - Wrong code submissions (before success)
   - Expired OTP submissions
   - Resend requests per session

### Log Events to Monitor

```bash
# Search for these events in Vercel logs:
OTP_SENT                  # OTP sent successfully
OTP_VERIFIED              # OTP verified successfully
OTP_SEND_ERROR           # SMS sending failed
OTP_VERIFY_ERROR         # Verification logic error
SUSPICIOUS_EVENT         # Potential abuse detected
```

### Suspicious Event Patterns (Auto-logged)

1. **otp_rate_limit_ip** - Same IP exceeds 2 requests/min
2. **otp_rate_limit_phone** - Same phone exceeds 3 requests/15min
3. **otp_max_attempts** - User exhausted all verification attempts
4. **otp_invalid_attempt** - Wrong code submitted
5. **otp_phone_mismatch** - Phone number doesn't match lead

### Dashboard Queries (Supabase/PostgreSQL)

#### OTP Conversion Funnel
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
  ROUND(100.0 * SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) / COUNT(*), 2) as verification_rate
FROM phone_verifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### Failed Verifications by Reason
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM phone_verifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND status IN ('expired', 'failed')
GROUP BY status;
```

#### Suspicious Activity Report
```sql
SELECT 
  event_type,
  severity,
  COUNT(*) as count,
  COUNT(DISTINCT ip_address) as unique_ips
FROM suspicious_events
WHERE event_type LIKE 'otp_%'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY count DESC;
```

---

## Rollback Plan

### If Critical Issue Found

1. **Immediate Rollback (Feature Flag):**
   ```bash
   vercel env rm ENFORCE_PHONE_VERIFICATION production
   vercel env add ENFORCE_PHONE_VERIFICATION production
   # Value: false
   vercel --prod
   ```
   - Takes 2-3 minutes
   - Allows bookings without OTP
   - Logs OTP attempts but doesn't block

2. **Full Rollback (Git Revert):**
   ```bash
   git log --oneline  # Find commit hash before OTP
   git revert <commit-hash>
   git push origin main
   vercel --prod
   ```
   - Takes 5-10 minutes
   - Removes all OTP code
   - Reverts to pre-OTP state

3. **Database Rollback (If Needed):**
   ```sql
   -- Drop phone verification tables (CAUTION: data loss)
   DROP TABLE IF EXISTS phone_verifications CASCADE;
   
   -- Remove column from leads (CAUTION: data loss)
   ALTER TABLE leads DROP COLUMN IF EXISTS phone_verified_at;
   ```

### Common Issues & Solutions

#### Issue: SMS Not Sending
- **Symptom:** OTP modal shows "Failed to send SMS"
- **Check:** Twilio credentials in Vercel env vars
- **Fix:** Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Temporary Fix:** Set `NODE_ENV=development` to log OTPs to console

#### Issue: Rate Limit Too Aggressive
- **Symptom:** Legitimate users getting rate limited
- **Check:** `IP_RATE_LIMIT` and `PHONE_RATE_LIMIT` constants in `/api/otp/send/route.ts`
- **Fix:** Increase limits (e.g., 3/min instead of 2/min)
- **Deploy:** Commit changes and redeploy

#### Issue: OTP Expiration Too Short
- **Symptom:** Users complain codes expire before entry
- **Check:** `OTP_EXPIRY_MINUTES` in `lib/sms.ts` (currently 5 minutes)
- **Fix:** Increase to 10 minutes
- **Deploy:** Commit changes and redeploy

#### Issue: High SMS Costs
- **Symptom:** Unexpected Twilio bills
- **Check:** Suspicious events (bots requesting OTPs)
- **Fix:** Tighten rate limits, add CAPTCHA on lead form
- **Monitor:** Query `suspicious_events` table for `otp_rate_limit_*`

---

## Success Metrics (30 Days Post-Launch)

### Product Goals
1. **Show-up Rate:** 80% → 92% (target)
2. **Fake Leads:** 10% → <2% (target)
3. **Booking Conversion:** ≥33% (maintain or improve)

### Technical Goals
1. **OTP Delivery:** >99% success rate
2. **Verification Rate:** >80% of OTP requests
3. **API Latency:** <2 seconds (P95)
4. **Zero Critical Incidents:** No production downtime

### Cost Targets
1. **Twilio SMS Cost:** <$0.01 per booking
2. **Infrastructure Cost:** No increase (serverless)

---

## Support & Troubleshooting

### Debug Mode (Development)

1. **Enable Console Logging:**
   ```javascript
   // In lib/sms.ts
   console.log('[DEV MODE] SMS to', phoneNumber, ':', message);
   ```

2. **Bypass OTP (Emergency):**
   ```bash
   # Set feature flag to false
   ENFORCE_PHONE_VERIFICATION=false
   ```

3. **Manual Phone Verification (Database):**
   ```sql
   -- Mark phone as verified manually
   UPDATE leads 
   SET phone_verified_at = NOW() 
   WHERE id = 'uuid-here';
   ```

### Contact Information
- **Engineer:** [Your Name/Team]
- **Twilio Support:** https://support.twilio.com/
- **AWS Support:** https://aws.amazon.com/support/
- **Incident Response:** [Your On-Call Procedure]

---

## Next Steps After Deployment

1. **Week 1:** Monitor Phase 1 logs, verify SMS delivery
2. **Week 2:** Enable Phase 2 enforcement, A/B test
3. **Week 3:** Analyze metrics, adjust rate limits if needed
4. **Week 4:** Review success metrics, plan optimizations

**Deployment Status:** ✅ Ready for Production

**Last Updated:** December 23, 2025
