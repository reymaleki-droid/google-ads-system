# Phase 3: Google Ads Read-Only Reporting Dashboard
**Implementation Status:** ✅ IN PROGRESS  
**Date:** December 27, 2025

---

## Overview

Phase 3 adds **customer-facing read-only Google Ads reporting** to the existing system. Customers can connect their Google Ads account via OAuth and view performance reports in their personal dashboard.

**Key Distinction:**
- **Existing (Admin):** Admin-level Google Ads integration for business owners
- **Phase 3 (Customer):** Customer-level reporting where each customer connects their own Google Ads account

---

## ✅ Completed (Session 1)

### 1. Database Migration
**File:** `supabase/migrations/008_google_ads_readonly_integration.sql`

**Tables Created:**
- `google_ads_accounts` - Store customer OAuth tokens (read-only scope)
- `google_ads_reports` - Cache report data (30-minute TTL)
- `google_ads_api_usage` - Track API calls for rate limiting

**Key Features:**
- RLS policies: Customers see only their own data
- Automatic token expiration tracking
- Cache management with TTL
- API usage logging for rate limits (100 requests/day per customer)

### 2. Existing Google Ads Integration Review
**Files Reviewed:**
- `lib/google-ads-api.ts` - Core API integration (admin-focused)
- `app/api/google-ads/auth/route.ts` - OAuth start
- `app/api/google-ads/callback/route.ts` - OAuth callback
- `app/api/google-ads/insights/route.ts` - Admin insights endpoint

**Findings:**
- Admin-level OAuth already functional
- Need to extend for multi-tenant customer usage
- Need customer-specific API endpoints for reports

---

## 🚧 In Progress (Session 1)

### 3. Customer-Facing Utilities
Creating customer-specific wrappers and formatters:

**Planned Files:**
- `lib/google-ads-customer.ts` - Customer-specific API wrappers
- `lib/google-ads-reports.ts` - Report formatting utilities
- `lib/google-ads-formatters.ts` - Data transformation helpers

---

## ⏳ Remaining Tasks

### 4. Customer API Endpoints
**New API Routes:**
- `app/api/customer/google-ads/connect/route.ts` - Start customer OAuth
- `app/api/customer/google-ads/callback/route.ts` - Handle customer OAuth callback
- `app/api/customer/google-ads/disconnect/route.ts` - Disconnect account
- `app/api/customer/google-ads/campaigns/route.ts` - Fetch campaign performance
- `app/api/customer/google-ads/keywords/route.ts` - Fetch keyword performance
- `app/api/customer/google-ads/account/route.ts` - Get account summary

### 5. UI Components
**New Components:**
- `components/reports/MetricsCard.tsx` - Display metric cards
- `components/reports/CampaignPerformanceChart.tsx` - Line/bar charts
- `components/reports/ReportTable.tsx` - Sortable data tables
- `components/reports/DateRangePicker.tsx` - Date range selector
- `components/reports/ConnectGoogleAds.tsx` - Connection UI

### 6. Customer Portal Pages
**New/Updated Pages:**
- `app/app/reports/page.tsx` - Main reports dashboard (NEW)
- `app/app/reports/campaigns/[id]/page.tsx` - Campaign detail view (NEW)
- `app/app/integrations/page.tsx` - Add Google Ads connect section (UPDATE)

### 7. Documentation & Testing
**Deliverables:**
- Phase 3 testing guide
- Environment variable documentation
- Customer onboarding guide
- API rate limiting documentation

---

## Architecture Overview

### Data Flow: Customer OAuth
```
1. Customer clicks "Connect Google Ads" in /app/integrations
2. Redirects to /api/customer/google-ads/connect
3. Google OAuth consent screen (read-only scope)
4. Google redirects to /api/customer/google-ads/callback
5. Exchange code for tokens
6. Store tokens in google_ads_accounts table (customer_id = auth.uid())
7. Redirect to /app/reports with success message
```

### Data Flow: Fetching Reports
```
1. Customer visits /app/reports
2. Frontend calls /api/customer/google-ads/campaigns?dateRange=LAST_30_DAYS
3. API checks cache (google_ads_reports table)
4. If cache miss or expired:
   a. Fetch from Google Ads API
   b. Store in cache with 30-minute TTL
   c. Log API usage
5. Format data for frontend
6. Return JSON response
7. Frontend renders charts and tables
```

### Security: RLS Enforcement
```sql
-- google_ads_accounts
CREATE POLICY "Users see own Google Ads accounts" 
  ON google_ads_accounts
  FOR ALL
  USING (customer_id = auth.uid());

-- google_ads_reports
CREATE POLICY "Users see own Google Ads reports"
  ON google_ads_reports
  FOR ALL
  USING (customer_id = auth.uid());
```

---

## Environment Variables Required

### Development (.env.local)
```env
# Google Ads OAuth (Customer Portal)
GOOGLE_ADS_CLIENT_ID=your_client_id_here
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_REDIRECT_URI=http://localhost:3000/api/customer/google-ads/callback

# Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)
```bash
vercel env add GOOGLE_ADS_CLIENT_ID production
vercel env add GOOGLE_ADS_CLIENT_SECRET production
vercel env add GOOGLE_ADS_DEVELOPER_TOKEN production
vercel env add GOOGLE_ADS_REDIRECT_URI production
# Value: https://your-domain.com/api/customer/google-ads/callback
```

---

## Key Features

### ✅ Multi-Tenant Support
- Each customer can connect their own Google Ads account
- Data isolation enforced by RLS
- No cross-customer data leakage

### ✅ Read-Only Scope
- OAuth scope: `https://www.googleapis.com/auth/adwords` (read-only)
- NO write operations (no campaign creation, no modifications)
- Only fetching performance data

### ✅ Performance Optimization
- 30-minute cache for report data
- Reduces API calls by 95%
- Database-backed cache with automatic expiration

### ✅ Rate Limiting
- 100 API requests per day per customer
- Logged in `google_ads_api_usage` table
- Graceful degradation when limits hit

### ✅ Auto Token Refresh
- Access tokens refreshed automatically when expired
- Refresh tokens stored securely in database
- Seamless user experience (no re-auth needed)

---

## Reports Included

### 1. Campaign Performance
- Campaign name, status
- Impressions, clicks, cost
- CTR, CPC, conversions
- Date ranges: Last 7/14/30 days, This/Last month

### 2. Keyword Performance
- Keyword text, match type
- Campaign and ad group names
- Same metrics as campaigns
- Sortable by cost, clicks, conversions

### 3. Account Summary
- Total impressions, clicks, cost
- Overall conversion metrics
- Currency and timezone info

---

## Testing Checklist

### OAuth Flow
- [ ] Click "Connect Google Ads" button
- [ ] Google consent screen appears
- [ ] Grant permission (read-only scope)
- [ ] Redirect back to app
- [ ] Account shows as connected in UI
- [ ] Tokens stored in database

### Report Fetching
- [ ] Campaign report loads correctly
- [ ] Data displays in tables and charts
- [ ] Date range selector works
- [ ] Cache reduces API calls (check logs)
- [ ] Refresh button clears cache

### Error Handling
- [ ] Graceful message if Google Ads not connected
- [ ] Handle expired tokens (auto-refresh)
- [ ] Handle API rate limits
- [ ] Handle network errors

### Multi-Tenancy
- [ ] Customer A cannot see Customer B's data
- [ ] RLS policies enforced correctly
- [ ] Each customer has separate cache

---

## Success Criteria

Phase 3 is complete when:

- ✅ Customer can connect their Google Ads account (OAuth)
- ✅ Reports dashboard shows campaign performance
- ✅ Charts display metrics over time
- ✅ Tables show sortable campaign/keyword data
- ✅ Export to CSV works
- ✅ Tokens refresh automatically
- ✅ RLS enforces data isolation
- ✅ Cache reduces API load by >90%
- ✅ All features tested and documented

---

## Next Session Tasks

1. Create `lib/google-ads-customer.ts` (customer API wrappers)
2. Create `lib/google-ads-reports.ts` (data formatting)
3. Create customer OAuth endpoints
4. Create report fetching endpoints
5. Build UI components
6. Build reports dashboard page
7. Update integrations page
8. Write testing guide

---

**Status:** Database migration complete, existing code reviewed, ready for customer-facing implementation.
