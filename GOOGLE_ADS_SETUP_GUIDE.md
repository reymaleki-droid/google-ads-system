# Google Ads API Integration - Setup Guide

## Overview
Google Ads API integration enables the platform to fetch campaign performance data and generate human-readable insights for non-technical users.

## Prerequisites

### 1. Google Ads Account
- Active Google Ads account with campaigns
- Admin access to the account
- Account should have at least 30 days of campaign data for meaningful insights

### 2. Google Cloud Project
- Create project at: https://console.cloud.google.com/
- Enable Google Ads API
- Create OAuth 2.0 credentials (Client ID + Secret)

### 3. Google Ads Developer Token
- Apply at: https://developers.google.com/google-ads/api/docs/get-started/dev-token
- **Approval time:** 24-48 hours (Basic tier), 2-4 weeks (Standard tier)
- **Required tier:** Basic (10,000 ops/day) sufficient for MVP

---

## Environment Variables

Add to `.env.local` (development) and Vercel (production):

```env
# Google Ads OAuth Credentials
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REDIRECT_URI=http://localhost:3000/api/google-ads/callback  # Change for production

# Google Ads API Access
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token  # From Google Ads API Center
GOOGLE_ADS_CUSTOMER_ID=1234567890  # 10-digit customer ID (no hyphens)
```

---

## Setup Steps

### Step 1: Google Cloud Console Setup (5 minutes)

1. **Create OAuth 2.0 Credentials:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Google Ads System - Production"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google-ads/callback` (development)
     - `https://your-domain.com/api/google-ads/callback` (production)

2. **Copy credentials:**
   - Client ID → `GOOGLE_ADS_CLIENT_ID`
   - Client secret → `GOOGLE_ADS_CLIENT_SECRET`

### Step 2: Apply for Developer Token (24-48 hours wait)

1. **Navigate to Google Ads API Center:**
   - URL: https://ads.google.com/aw/apicenter
   - Sign in with Google Ads account

2. **Apply for token:**
   - Use case: "Campaign performance data for lead generation platform"
   - Description: "Fetch campaign metrics to generate insights for non-technical users"
   - API usage: Read-only campaign data (no automated bidding)

3. **Wait for approval:**
   - Basic tier: 24-48 hours
   - Check email for approval notification
   - Copy developer token → `GOOGLE_ADS_DEVELOPER_TOKEN`

### Step 3: Get Customer ID (2 minutes)

1. **Find your customer ID:**
   - Sign in to Google Ads: https://ads.google.com/
   - Look in top right corner (format: 123-456-7890)
   - **Remove hyphens:** 1234567890
   - Copy → `GOOGLE_ADS_CUSTOMER_ID`

### Step 4: Database Migration (1 minute)

```bash
# Apply migration to Supabase
# Copy contents of supabase/migrations/007_google_ads_integration.sql
# Paste in Supabase SQL Editor → Run
```

Or via Supabase CLI:
```bash
supabase db push
```

### Step 5: OAuth Flow (3 minutes)

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Visit OAuth endpoint:**
   - URL: http://localhost:3000/api/google-ads/auth
   - This redirects to Google consent screen

3. **Grant permissions:**
   - Sign in with Google Ads account
   - Accept "View and manage your Google Ads accounts" permission
   - You'll be redirected back to `/admin/google-ads?google_ads=connected`

4. **Verify tokens saved:**
   - Check Supabase Table Editor → `google_ads_tokens` table
   - Confirm `refresh_token` is present
   - **Note:** Tokens start as `is_active = false` until developer_token is set

### Step 6: Activate Integration (1 minute)

Once developer token is approved and environment variables are set:

1. **Update tokens in database:**
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE google_ads_tokens
   SET 
     developer_token = 'your_developer_token_here',
     customer_id = '1234567890',
     is_active = true
   WHERE user_email = 'your_email@example.com';
   ```

2. **Or redeploy after setting env vars:**
   - Tokens will auto-update on next OAuth flow

---

## Verification

### 1. Test API Connection
```bash
# Visit status endpoint
curl http://localhost:3000/api/google-ads/status
```

Expected response:
```json
{
  "connected": true,
  "customerIds": ["1234567890"],
  "lastSyncedAt": null,
  "userEmail": "your_email@example.com"
}
```

### 2. Trigger First Sync
```bash
# Manual sync trigger (admin only)
curl -X POST http://localhost:3000/api/workers/google-ads-sync?secret=$CRON_SECRET
```

### 3. Check Dashboard
- Visit: http://localhost:3000/admin/google-ads
- Should show:
  - Connection status: ✅ Connected
  - Last sync timestamp
  - Campaign performance metrics (if sync ran)

---

## Troubleshooting

### "No refresh token received"
**Cause:** User previously authorized app, Google didn't issue new refresh_token

**Fix:**
1. Revoke app access: https://myaccount.google.com/permissions
2. Find "Google Ads System" → Remove access
3. Re-run OAuth flow (step 5 above)

### "Rate limit exceeded"
**Cause:** Exceeded 10,000 operations/day (Basic tier)

**Fix:**
1. Check `google_ads_sync_jobs` table for excessive sync attempts
2. Reduce sync frequency in `vercel.json` cron schedule
3. Apply for Standard tier (1M ops/day)

### "Customer not found"
**Cause:** Customer ID incorrect or account suspended

**Fix:**
1. Verify customer ID: https://ads.google.com/ (top right corner)
2. Remove hyphens: 123-456-7890 → 1234567890
3. Check account status (not suspended)

### "Developer token invalid"
**Cause:** Token not yet approved or misconfigured

**Fix:**
1. Check approval status: https://ads.google.com/aw/apicenter
2. Wait for approval email (24-48 hours)
3. Copy token exactly as shown (no extra spaces)

---

## Production Deployment

### Vercel Environment Variables

```bash
# Add all environment variables
vercel env add GOOGLE_ADS_CLIENT_ID production
vercel env add GOOGLE_ADS_CLIENT_SECRET production
vercel env add GOOGLE_ADS_REDIRECT_URI production  # https://yourdomain.com/api/google-ads/callback
vercel env add GOOGLE_ADS_DEVELOPER_TOKEN production
vercel env add GOOGLE_ADS_CUSTOMER_ID production

# Deploy
vercel --prod
```

### Post-Deployment

1. **Update OAuth redirect URI:**
   - Google Cloud Console → Credentials → Edit OAuth client
   - Add production URL: `https://yourdomain.com/api/google-ads/callback`

2. **Re-run OAuth flow:**
   - Visit: https://yourdomain.com/api/google-ads/auth
   - Grant permissions (production tokens separate from dev)

3. **Configure cron:**
   - Vercel automatically runs cron from `vercel.json`
   - Daily sync at 6 AM UTC

4. **Monitor logs:**
   ```bash
   vercel logs --follow | grep "Google Ads"
   ```

---

## Next Steps

- [ ] Apply for Google Ads Developer Token (BLOCKING - 24-48 hours)
- [ ] Create OAuth credentials in Google Cloud Console
- [ ] Set environment variables in `.env.local`
- [ ] Run database migration `007_google_ads_integration.sql`
- [ ] Complete OAuth flow at `/api/google-ads/auth`
- [ ] Activate tokens once developer token is approved
- [ ] Test first sync via `/api/workers/google-ads-sync`
- [ ] Deploy to production (repeat OAuth flow)

---

## Files Created

- ✅ `supabase/migrations/007_google_ads_integration.sql` - Database schema
- ✅ `lib/google-ads-api.ts` - OAuth wrapper + API client
- ✅ `app/api/google-ads/auth/route.ts` - OAuth initiation
- ✅ `app/api/google-ads/callback/route.ts` - OAuth callback handler
- ✅ `app/api/google-ads/status/route.ts` - Connection status check
- ⏳ `app/api/workers/google-ads-sync/route.ts` - Daily sync job (TODO)
- ⏳ `app/api/google-ads/insights/route.ts` - Insights endpoint (TODO)
- ⏳ `app/admin/google-ads/page.tsx` - Admin UI (TODO)

---

**Implementation Status:** Phase 1-2 Complete (Setup + OAuth) ✅  
**Next Phase:** Phase 3 (Data Sync Worker) + Phase 4 (Insights Engine)  
**Estimated Time to MVP:** 12-14 days (including developer token approval wait)
