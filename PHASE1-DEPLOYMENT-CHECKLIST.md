# Phase 1 Customer Portal - Quick Deployment Checklist

## ✅ Pre-Deployment

### 1. Database Migration
- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `supabase/migrations/007_customer_google_ads.sql`
- [ ] Execute migration
- [ ] Verify table created: `SELECT * FROM customer_google_ads_accounts LIMIT 1;`
- [ ] Verify RLS policies: `SELECT policyname FROM pg_policies WHERE tablename = 'customer_google_ads_accounts';`

### 2. Google Cloud Console Setup
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Select/create project
- [ ] Enable Google Ads API
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add authorized redirect URIs:
  - Development: `http://localhost:3000/api/customer/google-ads/callback`
  - Production: `https://yourdomain.com/api/customer/google-ads/callback`
- [ ] Configure OAuth consent screen (add Google Ads API scope)
- [ ] Copy Client ID and Client Secret

### 3. Environment Variables (Local)
```bash
# .env.local
GOOGLE_CLIENT_ID=<paste-client-id>
GOOGLE_CLIENT_SECRET=<paste-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/customer/google-ads/callback
```

### 4. Environment Variables (Production)
```bash
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_REDIRECT_URI production
# Value for GOOGLE_REDIRECT_URI: https://yourdomain.com/api/customer/google-ads/callback
```

---

## 🧪 Local Testing

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test OAuth Flow
- [ ] Navigate to `http://localhost:3000/app/reports`
- [ ] Click "Connect Google Ads"
- [ ] Verify redirect to Google OAuth consent
- [ ] Grant permissions
- [ ] Verify redirect back to reports page
- [ ] Verify "Google Ads Connected" status

### 3. Test Reports Dashboard
- [ ] Verify summary metrics display (Impressions, Clicks, Cost, Conversions)
- [ ] Verify campaign table loads
- [ ] Change date range → data updates
- [ ] Click refresh → data reloads
- [ ] Click export → CSV downloads
- [ ] Verify all formatting correct (currency, percentages)

### 4. Test Disconnect
- [ ] Click "Disconnect Google Ads"
- [ ] Confirm dialog
- [ ] Verify status changes to "Not Connected"
- [ ] Verify reconnect works

---

## 🚀 Deployment

### 1. Commit Changes
```bash
git add -A
git commit -m "Phase 1: Customer Portal - Google Ads reporting dashboard"
git push origin main
```

### 2. Deploy to Production
```bash
vercel --prod
```

### 3. Verify Production Deployment
- [ ] Visit production URL: `https://yourdomain.com/app/reports`
- [ ] Test complete OAuth flow
- [ ] Verify reports load correctly
- [ ] Check console for errors
- [ ] Test on mobile device

---

## 🔍 Post-Deployment Verification

### 1. Database Check
```sql
-- In Supabase SQL Editor
SELECT 
  customer_id,
  google_ads_customer_id,
  status,
  created_at
FROM customer_google_ads_accounts
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Monitor Logs
```bash
# Vercel logs
vercel logs --follow

# Look for:
# - "OAuth flow initiated"
# - "Tokens stored successfully"
# - "Campaign data fetched"
```

### 3. Test Error Scenarios
- [ ] Revoke Google OAuth permissions → verify graceful error
- [ ] Expired token → verify automatic refresh
- [ ] Invalid customer ID → verify 404 error
- [ ] Disconnected account → verify "Connect" CTA shows

---

## 📊 Success Criteria

### Technical
- [ ] Zero database errors in logs
- [ ] All API routes return proper status codes
- [ ] OAuth flow completes in <5 seconds
- [ ] Reports load in <2 seconds
- [ ] Token refresh happens automatically

### User Experience
- [ ] UI is responsive on mobile/tablet/desktop
- [ ] All text is readable (contrast ratios)
- [ ] Loading states are clear
- [ ] Error messages are user-friendly
- [ ] Export functionality works

---

## 🐛 Troubleshooting

### Issue: OAuth Redirect Fails
**Solution:** Check `GOOGLE_REDIRECT_URI` matches exactly in:
- `.env.local` / Vercel env vars
- Google Cloud Console authorized redirect URIs

### Issue: "Invalid Grant" Error
**Solution:** 
- Verify Google Ads API is enabled
- Check OAuth consent screen is configured
- Ensure redirect URI uses HTTPS in production

### Issue: "Access Token Expired" Error
**Solution:**
- Check `expires_at` in database
- Verify refresh token is not null
- Token refresh should happen automatically

### Issue: No Campaign Data
**Solution:**
- Verify customer has active Google Ads account
- Check Google Ads Customer ID is correct
- Ensure OAuth scopes include Google Ads API

---

## 📞 Support

**Documentation:** See `PHASE1-CUSTOMER-PORTAL-COMPLETE.md` for full details

**Files to Review:**
- `lib/google-ads/customer-oauth.ts` - OAuth integration
- `lib/google-ads/customer-client.ts` - API client
- `app/api/customer/google-ads/*` - API routes
- `app/app/reports/page.tsx` - Dashboard UI

---

## ✅ Deployment Complete!

Once all checklist items are complete, Phase 1 is live and customers can access their Google Ads reports!

**Next:** Monitor usage for 1-2 weeks, gather feedback, plan Phase 2 enhancements.

---

**Last Updated:** December 27, 2025
