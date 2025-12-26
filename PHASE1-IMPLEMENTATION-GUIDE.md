# Phase 1 Implementation Guide: Authentication & Multi-Tenancy

**Status:** ✅ Foundation Complete (Core files created)  
**Duration:** 2-3 weeks for full implementation  
**Date:** December 26, 2025

---

## 🎯 What Was Implemented (Sprint 1)

### ✅ Database Schema (Migration 007)
**File:** `supabase/migrations/007_add_authentication_system.sql`

**Created:**
- `user_roles` table (links auth.users to role: customer/admin)
- Added `customer_id` columns to all tables (leads, bookings, google_ads_*, attribution_events)
- Updated ALL RLS policies for multi-tenancy
- Helper functions: `is_admin()`, `is_customer()`

**To Apply:**
```bash
# Run in Supabase SQL Editor
psql $DATABASE_URL < supabase/migrations/007_add_authentication_system.sql

# Or via Supabase CLI
supabase db push
```

---

### ✅ Authentication Utilities
**File:** `lib/auth.ts`

**Functions:**
- `getServerUser()` - Get authenticated user in Server Components
- `createAuthenticatedClient()` - Create RLS-aware Supabase client
- `requireAuth()` - Protect API routes (throws 401 if not authenticated)
- `requireAdmin()` - Protect admin routes (throws 403 if not admin)
- `checkIsAdmin()` / `checkIsCustomer()` - Boolean role checks

**Usage Example:**
```typescript
// In Server Component
const user = await getServerUser();
if (!user) redirect('/login');

// In API Route
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  // User guaranteed to exist
}
```

---

### ✅ Middleware Authentication
**File:** `middleware.ts`

**Protection:**
- `/admin/*` routes → Requires admin role
- `/app/*` routes → Requires any authenticated user
- Redirects unauthenticated users to login
- Returns 403 for role mismatches

---

### ✅ Customer Authentication Pages
**Files Created:**
- `app/login/page.tsx` - Google Sign-In page
- `app/auth/callback/route.ts` - OAuth callback handler
- `app/app/layout.tsx` - Customer dashboard layout (protected)
- `app/app/dashboard/page.tsx` - Main customer dashboard

**Features:**
- Google OAuth integration
- Redirect after login (preserves original destination)
- User menu with email display
- Navigation: Dashboard, Campaigns, Alerts, Integrations, Settings
- Stats cards: Leads, Bookings, Cost Per Lead, Budget Used
- Google Ads connection prompt (if not connected)

---

## 🚧 Next Steps (Required for MVP)

### Step 1: Install Dependencies

**Add to package.json:**
```json
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/ssr": "^0.0.10"
  }
}
```

**Run:**
```bash
npm install @supabase/auth-helpers-nextjs @supabase/ssr
```

---

### Step 2: Configure Supabase Auth

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Enable Google OAuth:
   - Get credentials from Google Cloud Console
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Configure redirect URLs:
   - Site URL: `http://localhost:3000` (dev) or `https://yoursite.com` (prod)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://yoursite.com/auth/callback`

---

### Step 3: Apply Database Migration

```bash
# Option A: Supabase SQL Editor
# Copy/paste content of 007_add_authentication_system.sql

# Option B: Supabase CLI
supabase db push

# Verify
SELECT tablename FROM pg_tables WHERE tablename = 'user_roles';
```

---

### Step 4: Create First Admin User

**After migration, run this in Supabase SQL Editor:**
```sql
-- Replace with your actual Google email
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@gmail.com'),
  'admin'
);
```

---

### Step 5: Refactor API Routes (CRITICAL)

**Current Issue:** API routes use `service_role` (bypasses RLS)

**Pattern to Replace:**
```typescript
// ❌ OLD (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ NEW (respects RLS)
import { createAuthenticatedClient, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  const supabase = createAuthenticatedClient();
  
  // RLS automatically filters by customer_id = auth.uid()
  const { data } = await supabase.from('leads').select('*');
}
```

**Routes to Refactor:**
- `app/api/leads/route.ts` ✅ Already uses service_role (but needs customer_id insertion)
- `app/api/bookings/route.ts` ✅ Already uses service_role (but needs customer_id insertion)
- `app/api/admin/leads/route.ts` → Keep service_role, add admin check
- `app/api/admin/leads/[id]/route.ts` → Keep service_role, add admin check
- `app/api/google-ads/*` → Add authentication checks

---

### Step 6: Update Public Forms to Set customer_id

**Problem:** Lead/booking forms from public pages won't have customer_id

**Solution:** Keep anon INSERT policies, make customer_id nullable:
```sql
-- Already handled in migration 007
-- Anon users can INSERT without customer_id
-- Authenticated users MUST provide customer_id
```

---

### Step 7: Build Remaining Customer Pages

**Missing Pages:**
- `app/app/campaigns/page.tsx` - Campaign list view
- `app/app/alerts/page.tsx` - Notification center
- `app/app/integrations/page.tsx` - Google Ads connection management
- `app/app/settings/page.tsx` - Profile, password, logout

**Template (Campaign List):**
```typescript
import { getServerUser, createAuthenticatedClient } from '@/lib/auth';

export default async function CampaignsPage() {
  const user = await getServerUser();
  const supabase = createAuthenticatedClient();
  
  const { data: campaigns } = await supabase
    .from('google_ads_campaigns')
    .select('*')
    .eq('customer_id', user!.id);
  
  // Render campaign table
}
```

---

### Step 8: Build Admin Login Page

**Create:** `app/admin/login/page.tsx`

**Features:**
- Separate login page for admins (security)
- Email/password auth (optional: also allow Google)
- Redirect to `/admin/dashboard` after login

---

### Step 9: Update Admin Dashboard

**Current admin dashboard assumes no auth.** Need to:
1. Add `await requireAdmin()` check in admin API routes
2. Keep using service_role for admin routes (admins see all data)
3. Add customer management page: `/admin/customers`
4. Build impersonation feature (admin can view as customer)

---

### Step 10: Create Signup/Onboarding Flow

**New Pages:**
- `app/signup/page.tsx` - Google Sign-In for new users
- `app/onboarding/step-1/page.tsx` - Choose plan (Starter/Growth/Scale)
- `app/onboarding/step-2/page.tsx` - Connect Google Ads
- `app/onboarding/step-3/page.tsx` - Set goals
- `app/onboarding/complete/page.tsx` - Welcome + redirect to dashboard

**After signup:**
```typescript
// Create user_role record
INSERT INTO user_roles (user_id, role) VALUES (user_id, 'customer');
```

---

## 🧪 Testing Checklist

### Authentication Tests
- [ ] Can sign up with Google
- [ ] Can sign in with Google
- [ ] Redirected to login when accessing `/app/*` unauthenticated
- [ ] Redirected to admin login when accessing `/admin/*` unauthenticated
- [ ] Customer cannot access `/admin/*` routes (403 error)
- [ ] Admin cannot access `/app/*` routes (redirected to admin dashboard)

### Data Isolation Tests
- [ ] Customer A cannot see Customer B's leads (via API or dashboard)
- [ ] Customer A cannot see Customer B's campaigns
- [ ] Admin can see all customers' data
- [ ] Public lead forms still work (anon INSERT)

### RLS Policy Tests
**Run in Supabase SQL Editor:**
```sql
-- Test as customer
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<customer-user-id>';

-- Should return only that customer's leads
SELECT * FROM leads;

-- Test as admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<admin-user-id>';

-- Should return all leads (admin policy)
SELECT * FROM leads;
```

---

## 📝 Environment Variables

**Add to `.env.local`:**
```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## ⚠️ Breaking Changes & Migration Path

### For Existing Data
**All existing leads/bookings have `customer_id = NULL`**

**Solution:**
1. Keep null for historical data (admin-owned)
2. Mark as "legacy" in admin dashboard
3. Optionally assign to a "system" customer account

**Migration Script (optional):**
```sql
-- Create system customer
INSERT INTO auth.users (email) VALUES ('system@yourplatform.com');
INSERT INTO user_roles (user_id, role) 
  VALUES ((SELECT id FROM auth.users WHERE email = 'system@yourplatform.com'), 'admin');

-- Assign all null leads to system customer
UPDATE leads SET customer_id = (SELECT id FROM auth.users WHERE email = 'system@yourplatform.com')
WHERE customer_id IS NULL;
```

---

## 🚀 Deployment Checklist

### Before Deploying to Production:
- [ ] Run migration 007 on production database
- [ ] Configure Google OAuth in Supabase Dashboard (production project)
- [ ] Add production redirect URLs
- [ ] Set environment variables in Vercel/hosting platform
- [ ] Create first admin user manually
- [ ] Test authentication flow end-to-end
- [ ] Test data isolation (create 2 test customer accounts)
- [ ] Monitor logs for RLS policy violations

### After Deployment:
- [ ] Verify login works
- [ ] Verify admin dashboard accessible
- [ ] Verify customer dashboard shows correct data
- [ ] Check Supabase Auth logs for errors
- [ ] Set up monitoring alerts (failed logins, RLS violations)

---

## 📚 Next Phase: Google Ads Multi-Tenancy (Week 5-6)

**After Phase 1 is complete and tested**, proceed to:
1. Refactor Google Ads OAuth for per-customer accounts
2. Update sync worker to process per-customer
3. Add customer-facing Google Ads connection flow
4. Build campaign insights dashboard

**Estimated:** 3 weeks (see Phase 1 roadmap in planning doc)

---

## 🆘 Troubleshooting

### "Cannot read property 'id' of null"
- User not authenticated → Check middleware is running
- Session expired → Re-login required

### "Row Level Security policy violation"
- API route using anon key instead of authenticated client
- customer_id not set on INSERT
- RLS policy too restrictive

### "Forbidden - Admin access required"
- User doesn't have admin role in `user_roles` table
- Check: `SELECT * FROM user_roles WHERE user_id = '<user-id>';`

### OAuth Redirect Loop
- Redirect URLs misconfigured in Supabase Dashboard
- Check callback route is `/auth/callback` not `/api/auth/callback`

---

**Implementation Status:** 70% Complete (Core foundation ready)  
**Remaining Work:** API route refactoring, customer pages, onboarding flow  
**Ready for Testing:** Yes (with manual user_roles insertion)

