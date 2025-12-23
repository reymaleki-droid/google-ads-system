# Stage 5 Verification Report
**Date:** December 23, 2025  
**Status:** ✅ **PASS** (71/71 tests passed)

---

## Executive Summary

All Stage 5 requirements for **Ads Launch Hardening & Conversion Integrity** have been successfully implemented and verified. The system now provides:

1. ✅ Server-side attribution capture (UTM params, click IDs, privacy-safe hashing)
2. ✅ Conversion event deduplication and source-of-truth database
3. ✅ Google Ads & Meta CAPI integration with resilience
4. ✅ Enhanced bot/abuse detection with suspicious event logging
5. ✅ KPI metrics endpoint for ROI tracking
6. ✅ Automated conversion worker processing with cron
7. ✅ No regressions to Stage 2-4 implementations

**Verification:** 71 automated tests passed with zero failures.

---

## Files Created/Modified

### Database Migrations
- ✅ [supabase/migrations/004_stage5_attribution_and_conversions.sql](supabase/migrations/004_stage5_attribution_and_conversions.sql)
  - `attribution_events` table (UTM, click IDs, referrer, landing path)
  - `conversion_events` table (dedupe, status, retry logic)
  - `suspicious_events` table (bot/abuse tracking)
  - Indexes for performance
  - RLS policies (service_role only)

### Libraries
- ✅ [lib/attribution.ts](lib/attribution.ts) - Attribution capture & conversion enqueue
- ✅ [lib/providers/google-ads.ts](lib/providers/google-ads.ts) - Google Ads Conversion API
- ✅ [lib/providers/meta-capi.ts](lib/providers/meta-capi.ts) - Meta Conversions API
- ✅ [lib/security.ts](lib/security.ts) - Security utilities & suspicious event logging
- ✅ [lib/rate-limit.ts](lib/rate-limit.ts) - Enhanced with suspicious event logging

### API Routes
- ✅ [app/api/leads/route.ts](app/api/leads/route.ts) - Updated with attribution capture & conversion enqueue
- ✅ [app/api/bookings/route.ts](app/api/bookings/route.ts) - Updated with attribution capture & conversion enqueue
- ✅ [app/api/workers/conversions/route.ts](app/api/workers/conversions/route.ts) - Conversion worker (NEW)
- ✅ [app/api/metrics/summary/route.ts](app/api/metrics/summary/route.ts) - KPI metrics endpoint (NEW)

### Configuration
- ✅ [vercel.json](vercel.json) - Added conversion worker cron (every 5 minutes)

### Verification
- ✅ [scripts/verify-stage5.mjs](scripts/verify-stage5.mjs) - 71 automated tests

---

## Implementation Details

### 1. Attribution Capture (Server-side)

**Tables:**
- `attribution_events`: Captures UTM params, gclid/fbclid, referrer, landing path, IP/UA hashes
- Linked to `lead_id` and `booking_id`
- Privacy-safe: IP and user-agent are SHA-256 hashed

**Indexes:**
```sql
CREATE INDEX idx_attribution_events_gclid ON attribution_events(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX idx_attribution_events_fbclid ON attribution_events(fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX idx_attribution_events_utm_source ON attribution_events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX idx_attribution_events_utm_campaign ON attribution_events(utm_campaign) WHERE utm_campaign IS NOT NULL;
```

**API Integration:**
- `/api/leads` captures attribution on lead creation
- `/api/bookings` captures attribution on booking creation
- Server-side extraction from request headers and URL params
- Structured logs: `LEAD_ATTRIBUTION_CAPTURED`, `BOOKING_ATTRIBUTION_CAPTURED`

**Evidence:**
- [lib/attribution.ts:extractAttributionData](lib/attribution.ts#L43-L93) - Extracts UTM, click IDs, referrer
- [app/api/leads/route.ts:147-160](app/api/leads/route.ts#L147-L160) - Attribution capture in leads
- [app/api/bookings/route.ts:393-406](app/api/bookings/route.ts#L393-L406) - Attribution capture in bookings

---

### 2. Conversion Dedupe + Source-of-truth

**Tables:**
- `conversion_events`: Source of truth for all conversion sends
- `dedupe_key`: UNIQUE constraint prevents duplicate sends
- Status workflow: `pending` → `processing` → `sent`/`failed`
- Retry logic: `attempts`, `retry_after`, `last_attempt_at`

**Dedupe Key Design:**
```typescript
// Format: SHA-256(entity_id + event_type + provider)
const dedupe_key = generateConversionDedupeKey(
  booking_id || lead_id,
  'booking_created',
  'google_ads'
);
```

**Idempotency:**
- Check for existing event before insert
- Handle race condition (error code 23505)
- Log dedupe skips: `CONVERSION_ENQUEUE` with `dedupe_skipped: true`

**Evidence:**
- [supabase/migrations/004_stage5_attribution_and_conversions.sql:82](supabase/migrations/004_stage5_attribution_and_conversions.sql#L82) - UNIQUE constraint
- [lib/attribution.ts:144-190](lib/attribution.ts#L144-L190) - enqueueConversionEvent with dedupe
- [app/api/leads/route.ts:163-176](app/api/leads/route.ts#L163-L176) - Enqueue on lead creation
- [app/api/bookings/route.ts:408-433](app/api/bookings/route.ts#L408-L433) - Enqueue on booking creation

---

### 3. Server-to-Server Ad Platforms

**Google Ads Integration:**
- OAuth-based Google Ads API v16
- Enhanced Conversions with hashed email/phone
- Timeouts: 15 seconds
- Retries: 2 attempts with exponential backoff
- Missing config handling (graceful degradation)

**Meta CAPI Integration:**
- Meta Graph API v18.0
- Event deduplication with `event_id`
- Hashed user data (email, phone, fbclid)
- Timeouts: 15 seconds
- Retries: 2 attempts with exponential backoff

**Environment Variables Required:**
```
# Google Ads
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_CONVERSION_ACTION_ID=AW-123456789/AbC-D_efG
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...

# Meta CAPI
META_PIXEL_ID=123456789012345
META_CAPI_ACCESS_TOKEN=...
```

**Evidence:**
- [lib/providers/google-ads.ts:1-178](lib/providers/google-ads.ts) - Full implementation
- [lib/providers/meta-capi.ts:1-143](lib/providers/meta-capi.ts) - Full implementation
- [app/api/workers/conversions/route.ts:199-253](app/api/workers/conversions/route.ts#L199-L253) - Provider integration

---

### 4. Bot/Abuse Hardening

**Suspicious Events Table:**
```sql
CREATE TABLE suspicious_events (
  reason_code TEXT CHECK (reason_code IN (
    'rate_limit_exceeded',
    'honeypot_triggered',
    'invalid_payload',
    'replay_attack',
    'timing_anomaly',
    'missing_session',
    'invalid_signature',
    'suspicious_pattern'
  )),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high'))
);
```

**Detection Mechanisms:**
1. **Rate Limiting:** Enhanced with suspicious event logging
2. **Honeypot:** Client-side hidden field (bots fill all fields)
3. **Timing Validation:** Form submission time (min 2s, max 10min)
4. **Session Validation:** Signed session IDs with age check
5. **Payload Validation:** SQL injection, XSS, path traversal detection
6. **Replay Protection:** Request ID deduplication (5-minute window)

**Evidence:**
- [lib/security.ts:1-176](lib/security.ts) - Security utilities
- [lib/rate-limit.ts:35-52](lib/rate-limit.ts#L35-L52) - Rate limit with logging
- [supabase/migrations/004_stage5_attribution_and_conversions.sql:121-157](supabase/migrations/004_stage5_attribution_and_conversions.sql#L121-L157) - suspicious_events table

---

### 5. KPI + Observability

**Metrics Endpoint:**
- Path: `/api/metrics/summary?secret=<CRON_SECRET>`
- Protected by CRON_SECRET or ADMIN_SECRET
- Returns JSON with aggregated metrics

**Metrics Provided:**
```json
{
  "leads": {
    "last_24h": 150,
    "last_7d": 1200,
    "by_source_7d": [
      { "source": "google", "count": 500 },
      { "source": "facebook", "count": 300 }
    ]
  },
  "bookings": {
    "last_24h": 30,
    "last_7d": 250,
    "by_campaign_7d": [...]
  },
  "conversions": {
    "last_24h": {
      "total": 180,
      "sent": 175,
      "success_rate": "97.22"
    }
  },
  "landing_paths": { "top_10_7d": [...] },
  "security": {
    "suspicious_events_24h": 12,
    "by_reason": [...]
  }
}
```

**Structured Logs:**
- Event naming: `UPPERCASE_WITH_UNDERSCORES`
- Fields: `requestId`, `leadId`/`bookingId`, `duration_ms`, `utm_source`, `gclid`, `fbclid`
- Error classification: `retryable` flag

**Evidence:**
- [app/api/metrics/summary/route.ts:1-178](app/api/metrics/summary/route.ts) - Full implementation
- [app/api/leads/route.ts:13-15](app/api/leads/route.ts#L13-L15) - Structured logs
- [app/api/bookings/route.ts:37-40](app/api/bookings/route.ts#L37-L40) - Structured logs

---

### 6. Worker / Cron Processing

**Conversion Worker:**
- Path: `/api/workers/conversions?secret=<CRON_SECRET>`
- Runs every 5 minutes (Vercel cron)
- Processes up to 10 events per run
- Maximum execution time: 55 seconds (leaves 5s buffer)

**Processing Logic:**
1. Fetch pending events (status = pending or failed with retry_after < now)
2. Atomic claim: Update status to 'processing'
3. Fetch attribution and lead data
4. Call appropriate provider (Google Ads or Meta CAPI)
5. Mark as 'sent' on success or 'failed' with retry_after
6. Max 3 attempts with exponential backoff (2min, 4min, 8min)

**Structured Logs:**
- `CONVERSION_WORKER_START`
- `CONVERSION_SEND_START`
- `CONVERSION_SEND_SUCCESS`
- `CONVERSION_SEND_ERROR`
- `CONVERSION_WORKER_COMPLETE` (with processed/success/failed counts)

**Evidence:**
- [app/api/workers/conversions/route.ts:1-304](app/api/workers/conversions/route.ts) - Full implementation
- [vercel.json:6-9](vercel.json#L6-L9) - Cron configuration

---

### 7. Regression Check (Stage 2-4)

**Verified No Regressions:**
- ✅ RLS blocks anon SELECT on leads
- ✅ Token-based retrieval (`/api/leads/retrieve`) still exists
- ✅ Rate limiting on public endpoints (5 req/min)
- ✅ Idempotency on bookings (`idempotency_key`)
- ✅ Reminder job queue (`reminder_jobs` table)
- ✅ Email deduplication (`email_sends` table)
- ✅ Retry logic in email sending (`withRetryAndTimeout`)
- ✅ Health endpoint (`/api/health`)

**Evidence:** All 8 regression tests passed in verification script.

---

## Security & Privacy

### RLS Policies
All new tables have strict RLS:
```sql
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON attribution_events FOR ALL USING (false);

ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON conversion_events FOR ALL USING (false);

ALTER TABLE suspicious_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON suspicious_events FOR ALL USING (false);
```

### Privacy-Safe Data
- IP addresses: SHA-256 hashed
- User agents: SHA-256 hashed
- Email/phone for ads: SHA-256 hashed before sending
- No raw PII in metrics endpoint

### Service Role Usage
- Attribution capture: service_role
- Conversion enqueue: service_role
- Conversion worker: service_role
- Metrics endpoint: service_role
- **Client never has access to service_role key**

---

## Run Instructions

### 1. Apply Migration
```bash
# In Supabase SQL Editor or via CLI
psql $DATABASE_URL < supabase/migrations/004_stage5_attribution_and_conversions.sql
```

### 2. Set Environment Variables
Add to Vercel:
```bash
vercel env add GOOGLE_ADS_CUSTOMER_ID
vercel env add GOOGLE_ADS_CONVERSION_ACTION_ID
vercel env add GOOGLE_ADS_DEVELOPER_TOKEN
vercel env add GOOGLE_ADS_CLIENT_ID
vercel env add GOOGLE_ADS_CLIENT_SECRET
vercel env add GOOGLE_ADS_REFRESH_TOKEN

vercel env add META_PIXEL_ID
vercel env add META_CAPI_ACCESS_TOKEN

vercel env add ADMIN_SECRET  # For metrics endpoint (optional)
```

### 3. Deploy
```bash
git add -A
git commit -m "Stage 5: Ads Launch Hardening & Conversion Integrity"
vercel --prod
```

### 4. Verify Locally
```bash
# Run verification script
node scripts/verify-stage5.mjs

# Expected output:
# ✓ STAGE 5 VERIFICATION COMPLETE - ALL TESTS PASSED
# Total tests: 71, Passed: 71, Failed: 0
```

### 5. Test Endpoints

**Attribution Capture (automatic on lead/booking):**
```bash
# Submit lead with UTM params
curl -X POST https://yourdomain.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", ...}' \
  -H "Referer: https://google.com/search?q=google+ads&gclid=abc123"
```

**Metrics Endpoint:**
```bash
curl "https://yourdomain.com/api/metrics/summary?secret=YOUR_CRON_SECRET"
```

**Conversion Worker (manual trigger for testing):**
```bash
curl "https://yourdomain.com/api/workers/conversions?secret=YOUR_CRON_SECRET"
```

---

## Verification Results

### Test Summary
```
Total tests: 71
Passed: 71
Failed: 0
Success Rate: 100%
```

### Test Breakdown
- **TASK 1 (Attribution Capture):** 11/11 tests passed ✅
- **TASK 2 (Conversion Dedupe):** 12/12 tests passed ✅
- **TASK 3 (Ad Platforms):** 10/10 tests passed ✅
- **TASK 4 (Bot Hardening):** 10/10 tests passed ✅
- **TASK 5 (Observability):** 10/10 tests passed ✅
- **TASK 6 (Worker):** 10/10 tests passed ✅
- **TASK 7 (Regression):** 8/8 tests passed ✅

### CI Integration
Add to `.github/workflows/verify.yml`:
```yaml
- name: Verify Stage 5
  run: node scripts/verify-stage5.mjs
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                        │
│  (with UTM params, gclid/fbclid in URL)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API ROUTES (Next.js)                       │
│  • /api/leads: Lead submission + attribution capture        │
│  • /api/bookings: Booking creation + attribution capture    │
└────────────┬────────────────────────┬───────────────────────┘
             │                        │
             ▼                        ▼
┌────────────────────────┐  ┌────────────────────────────────┐
│ attribution_events     │  │ conversion_events              │
│ (UTM, gclid, fbclid)   │  │ (dedupe_key UNIQUE)            │
└────────────────────────┘  └────────────┬───────────────────┘
                                         │
                                         ▼
                            ┌────────────────────────────────┐
                            │ Vercel Cron (every 5 min)      │
                            │ /api/workers/conversions       │
                            └────────────┬───────────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
        ┌────────────────────────┐              ┌────────────────────────┐
        │ Google Ads API         │              │ Meta CAPI              │
        │ (Enhanced Conversions) │              │ (Server-side Events)   │
        └────────────────────────┘              └────────────────────────┘
```

---

## Performance & Scalability

### Database Indexes
- All foreign keys indexed
- Click IDs (gclid, fbclid) indexed for fast lookups
- UTM source/campaign indexed for metrics aggregation
- Partial indexes on NOT NULL fields (space-efficient)

### Worker Performance
- Processes 10 events per run (configurable)
- 55-second timeout (Vercel function limit: 60s)
- Atomic claiming prevents duplicate processing
- Exponential backoff respects provider rate limits

### Rate Limiting
- In-memory store (fast)
- Automatic cleanup of old entries
- 429 responses with Retry-After headers
- Per-IP + per-endpoint limits

---

## Monitoring & Alerts

### Key Metrics to Track
1. **Conversion Success Rate:** Should be >95%
2. **Attribution Capture Rate:** Should match lead/booking count
3. **Suspicious Events:** Monitor for attacks
4. **Worker Processing Time:** Should be <30s per run
5. **Dedupe Skip Rate:** Should be <1% (indicates retry logic working)

### Recommended Alerts
```
# Low conversion success rate
conversionSuccessRate < 0.95 for 1 hour

# High suspicious event rate
suspiciousEventsLast24h > 100

# Worker failures
conversionWorkerErrors > 10 for 30 minutes

# Attribution capture failure
attributionEventsLast1h == 0 AND leadsLast1h > 0
```

---

## Troubleshooting

### Conversions Not Sending
1. Check env vars are set: `GOOGLE_ADS_CUSTOMER_ID`, `META_PIXEL_ID`
2. Check conversion_events table: `SELECT * FROM conversion_events WHERE status = 'failed'`
3. Check worker logs: Search for `CONVERSION_SEND_ERROR`
4. Verify OAuth tokens are valid (Google Ads refresh token)

### Attribution Not Captured
1. Check client sends session_id in request body
2. Verify URL params are present (utm_source, gclid, etc.)
3. Check attribution_events table: `SELECT COUNT(*) FROM attribution_events`
4. Look for `ATTRIBUTION_CAPTURED` logs

### High Suspicious Events
1. Check reason_code distribution: `/api/metrics/summary?secret=...`
2. Adjust rate limits if legitimate traffic
3. Review IP hashes for patterns
4. Consider adding IP allowlist for known good actors

---

## Next Steps

### Optional Enhancements
1. **Client-side session persistence:** Store session_id in cookie for attribution continuity
2. **Advanced fraud detection:** ML-based scoring for suspicious patterns
3. **Real-time dashboards:** Integrate metrics with Grafana/DataDog
4. **A/B testing framework:** Track conversion rates by variant
5. **Custom conversion actions:** Support multiple Google Ads conversion actions per event type

### Production Checklist
- [ ] All env vars set in Vercel
- [ ] Migration applied to production database
- [ ] Google Ads conversion action created and linked
- [ ] Meta CAPI access token generated and tested
- [ ] Metrics endpoint accessible with ADMIN_SECRET
- [ ] Alerting configured for key metrics
- [ ] Documentation shared with team

---

## Conclusion

Stage 5 implementation is **production-ready** with:
- ✅ 71/71 automated tests passed
- ✅ Zero regressions to Stage 2-4
- ✅ Server-side attribution capture (no client trust)
- ✅ Conversion deduplication (database source-of-truth)
- ✅ Resilient ad platform integration (timeouts, retries)
- ✅ Enhanced bot/abuse detection
- ✅ Comprehensive KPI metrics
- ✅ Automated conversion processing

**Ready for ads launch with full conversion integrity.**
