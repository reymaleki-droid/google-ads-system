# Phase 1 Architecture - Visual Guide

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE ADS SYSTEM v2.0                            │
│                     (Multi-Tenant SaaS Platform)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐       ┌───────────────────────┐
        │   CUSTOMER PORTAL     │       │    ADMIN PORTAL       │
        │   (/app/*)            │       │    (/admin/*)         │
        │                       │       │                       │
        │  • Dashboard          │       │  • All Customers      │
        │  • Campaigns          │       │  • All Leads          │
        │  • Alerts             │       │  • System Metrics     │
        │  • Settings           │       │  • User Management    │
        │  • Integrations       │       │  • Billing            │
        └───────────┬───────────┘       └───────────┬───────────┘
                    │                               │
                    │  Authentication Required      │
                    │  (Middleware checks)          │
                    │                               │
                    ▼                               ▼
        ┌─────────────────────────────────────────────────────────┐
        │              AUTHENTICATION LAYER                        │
        │                                                          │
        │  ┌─────────────────────────────────────────────────┐   │
        │  │         Supabase Auth (Google OAuth)            │   │
        │  │  • Google Sign-In                               │   │
        │  │  • Cookie-based sessions                        │   │
        │  │  • Role detection (customer/admin)              │   │
        │  │  • Session management                           │   │
        │  └─────────────────────────────────────────────────┘   │
        │                                                          │
        │  Utilities: lib/auth.ts                                 │
        │  • getServerUser() - Get user + role                   │
        │  • requireAuth() - Protect API routes                  │
        │  • createAuthenticatedClient() - RLS-aware client      │
        └──────────────────────┬───────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────────────────┐
        │            API ROUTES (Protected)                         │
        │                                                           │
        │  Customer Routes:                                         │
        │  • /api/customer/campaigns (GET/POST)                    │
        │  • /api/customer/stats                                   │
        │  • /api/customer/alerts                                  │
        │                                                           │
        │  Admin Routes:                                            │
        │  • /api/admin/customers                                  │
        │  • /api/admin/leads                                      │
        │  • /api/admin/metrics                                    │
        │                                                           │
        │  System Routes (Service Role):                           │
        │  • /api/workers/* (Bypass RLS)                          │
        │  • /api/cron/* (Bypass RLS)                             │
        └──────────────────────┬───────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────────────────┐
        │         DATABASE (PostgreSQL + RLS)                       │
        │                                                           │
        │  ┌─────────────────────────────────────────────────┐    │
        │  │  CUSTOMER DATA (customer_id filtered)           │    │
        │  │                                                  │    │
        │  │  • leads (customer_id)                          │    │
        │  │  • bookings (customer_id)                       │    │
        │  │  • google_ads_campaigns (customer_id)           │    │
        │  │  • google_ads_ad_groups (customer_id)           │    │
        │  │  • google_ads_keywords (customer_id)            │    │
        │  │  • attribution_events (customer_id)             │    │
        │  │  • conversion_events (customer_id)              │    │
        │  └─────────────────────────────────────────────────┘    │
        │                                                           │
        │  ┌─────────────────────────────────────────────────┐    │
        │  │  SYSTEM DATA (no customer_id)                   │    │
        │  │                                                  │    │
        │  │  • user_roles (role mapping)                    │    │
        │  │  • suspicious_events (security logs)            │    │
        │  │  • phone_verifications (OTP)                    │    │
        │  └─────────────────────────────────────────────────┘    │
        │                                                           │
        │  RLS Policies:                                            │
        │  ✓ Customer: SELECT/INSERT/UPDATE own data only          │
        │  ✓ Admin: SELECT/UPDATE ALL data                        │
        │  ✓ Service Role: Bypass RLS for system operations      │
        └──────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────┐
│   User      │
│  Visits     │
│  /signup    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Signup Page                            │
│  • "Sign up with Google" button         │
└──────┬──────────────────────────────────┘
       │ Click
       ▼
┌─────────────────────────────────────────┐
│  Google OAuth                           │
│  • User authorizes app                  │
│  • Google returns auth code             │
└──────┬──────────────────────────────────┘
       │ Redirect
       ▼
┌─────────────────────────────────────────┐
│  /auth/callback                         │
│  • Exchange code for session            │
│  • Create user in auth.users            │
│  • Set cookie                           │
└──────┬──────────────────────────────────┘
       │
       ├─── New User ────────────────────────┐
       │                                     ▼
       │                          ┌────────────────────┐
       │                          │  Insert into       │
       │                          │  user_roles        │
       │                          │  (customer)        │
       │                          └─────────┬──────────┘
       │                                    │
       │                                    ▼
       │                          ┌────────────────────┐
       │                          │  Redirect to       │
       │                          │  /onboarding/step-1│
       │                          └────────────────────┘
       │
       └─── Existing User ─────────────────┐
                                            ▼
                                 ┌────────────────────┐
                                 │  Redirect to       │
                                 │  /app/dashboard    │
                                 └────────────────────┘
```

---

## 🛡️ RLS Policy Illustration

### Customer Access Pattern
```
┌──────────────────────────────────────────────────────────┐
│  Customer A (user_id: abc-123)                           │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  RLS Filter Applied:                                     │
│  WHERE customer_id = auth.uid()                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  Database Results:                                       │
│                                                          │
│  leads:                                                  │
│  ✓ Lead 1 (customer_id: abc-123)   ← VISIBLE           │
│  ✗ Lead 2 (customer_id: xyz-789)   ← HIDDEN            │
│  ✓ Lead 3 (customer_id: abc-123)   ← VISIBLE           │
│                                                          │
│  campaigns:                                              │
│  ✓ Campaign A (customer_id: abc-123) ← VISIBLE         │
│  ✗ Campaign B (customer_id: xyz-789) ← HIDDEN          │
└──────────────────────────────────────────────────────────┘
```

### Admin Access Pattern
```
┌──────────────────────────────────────────────────────────┐
│  Admin (user_id: admin-456, role: admin)                │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  RLS Check:                                              │
│  IF is_admin(auth.uid()) THEN BYPASS FILTER             │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  Database Results:                                       │
│                                                          │
│  leads:                                                  │
│  ✓ Lead 1 (customer_id: abc-123)   ← VISIBLE           │
│  ✓ Lead 2 (customer_id: xyz-789)   ← VISIBLE           │
│  ✓ Lead 3 (customer_id: abc-123)   ← VISIBLE           │
│                                                          │
│  campaigns:                                              │
│  ✓ Campaign A (customer_id: abc-123) ← VISIBLE         │
│  ✓ Campaign B (customer_id: xyz-789) ← VISIBLE         │
│                                                          │
│  ALL DATA VISIBLE                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Customer Creates Campaign

```
1. User Action
   ↓
┌────────────────────────────────────┐
│  Customer clicks "New Campaign"    │
│  in /app/campaigns                 │
└──────────────┬─────────────────────┘
               │
2. Frontend Request
               ↓
┌────────────────────────────────────┐
│  POST /api/customer/campaigns      │
│  Headers: Cookie (session)         │
│  Body: { name, budget }            │
└──────────────┬─────────────────────┘
               │
3. Authentication Check
               ↓
┌────────────────────────────────────┐
│  requireAuth()                     │
│  • Reads session cookie            │
│  • Validates with Supabase         │
│  • Returns user + role             │
└──────────────┬─────────────────────┘
               │
4. Create RLS Client
               ↓
┌────────────────────────────────────┐
│  createAuthenticatedClient()       │
│  • Creates Supabase client         │
│  • Includes user context           │
└──────────────┬─────────────────────┘
               │
5. Database Insert
               ↓
┌────────────────────────────────────┐
│  supabase                          │
│    .from('google_ads_campaigns')   │
│    .insert({                       │
│      customer_id: user.id, ← RLS   │
│      name: 'Campaign X',           │
│      budget: 5000                  │
│    })                              │
└──────────────┬─────────────────────┘
               │
6. RLS Policy Check
               ▼
┌────────────────────────────────────┐
│  INSERT Policy:                    │
│  WITH CHECK (                      │
│    customer_id = auth.uid()        │
│  )                                 │
│  ✓ PASS (customer_id matches)     │
└──────────────┬─────────────────────┘
               │
7. Success Response
               ▼
┌────────────────────────────────────┐
│  { ok: true, campaign: { ... } }   │
└────────────────────────────────────┘
```

---

## 📊 Data Tables Comparison

### Before Phase 1 (Single-Tenant)
```
┌────────────────────────────┐
│  leads                     │
├────────────────────────────┤
│  id         UUID           │
│  email      TEXT           │
│  phone      TEXT           │
│  created_at TIMESTAMPTZ    │
│  ... (no customer_id)      │
└────────────────────────────┘

Problem: All users see ALL data
```

### After Phase 1 (Multi-Tenant)
```
┌────────────────────────────┐
│  leads                     │
├────────────────────────────┤
│  id         UUID           │
│  customer_id UUID ← NEW!   │
│  email      TEXT           │
│  phone      TEXT           │
│  created_at TIMESTAMPTZ    │
│  ...                       │
└────────────────────────────┘

RLS Policy:
• Customer: WHERE customer_id = auth.uid()
• Admin: No filter (see all)
• Service: Bypass RLS

Result: Users only see their data
```

---

## 🎯 Use Cases Supported

### Use Case 1: Customer Signs Up
```
1. Visit /signup
2. Click "Sign up with Google"
3. Authorize app
4. → Redirect to /onboarding/step-1
5. Choose plan
6. Connect Google Ads
7. → Redirect to /app/dashboard
```

### Use Case 2: Customer Views Campaigns
```
1. Visit /app/campaigns
2. Page calls: const user = await getServerUser()
3. Page calls: const supabase = createAuthenticatedClient()
4. Query: supabase.from('google_ads_campaigns').select('*')
5. RLS applies: WHERE customer_id = user.id
6. Only customer's campaigns returned
```

### Use Case 3: Admin Views All Data
```
1. Visit /admin/login
2. Sign in (must have admin role in user_roles)
3. Visit /admin/dashboard
4. Query: supabase.from('leads').select('*')
5. RLS checks: is_admin(auth.uid()) = true
6. ALL leads returned (no filter)
```

### Use Case 4: Worker Processes Conversions
```
1. Vercel Cron triggers /api/workers/conversions
2. Uses service_role key (not authenticated user)
3. Query: supabase.from('conversion_events').select('*')
4. RLS bypassed (service_role)
5. All pending conversions processed
```

---

## 🔑 Key Security Principles

### 1. Never Trust Client Input
```typescript
// ❌ WRONG - Client can tamper with customer_id
const { customer_id } = request.body;
await supabase.from('leads').insert({ customer_id, ... });

// ✅ CORRECT - Use authenticated user's ID
const user = await requireAuth();
await supabase.from('leads').insert({ customer_id: user.id, ... });
```

### 2. Always Use Authenticated Client
```typescript
// ❌ WRONG - Service role bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);
const { data } = await supabase.from('leads').select('*');
// Returns ALL leads, not just user's

// ✅ CORRECT - Use authenticated client
const supabase = createAuthenticatedClient();
const { data } = await supabase.from('leads').select('*');
// RLS automatically filters to user's leads
```

### 3. Protect All Routes
```typescript
// ❌ WRONG - No authentication check
export async function GET(request: NextRequest) {
  const supabase = createAuthenticatedClient();
  const { data } = await supabase.from('campaigns').select('*');
  return NextResponse.json({ data });
}

// ✅ CORRECT - Require authentication
export async function GET(request: NextRequest) {
  const user = await requireAuth(); // Throws if not authenticated
  const supabase = createAuthenticatedClient();
  const { data } = await supabase.from('campaigns').select('*');
  return NextResponse.json({ data });
}
```

---

## 📚 File Structure Reference

```
google-ads-system/
├── app/
│   ├── app/                        # Customer Portal
│   │   ├── layout.tsx              # Customer layout + nav
│   │   ├── dashboard/page.tsx      # Main dashboard
│   │   ├── campaigns/page.tsx      # Campaign list
│   │   ├── alerts/page.tsx         # Alert center
│   │   ├── integrations/page.tsx   # Google Ads connection
│   │   └── settings/page.tsx       # Account settings
│   │
│   ├── admin/                      # Admin Portal
│   │   ├── login/page.tsx          # Admin login
│   │   └── dashboard/page.tsx      # Admin dashboard
│   │
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth handler
│   │   └── signout/route.ts        # Sign out
│   │
│   ├── api/
│   │   ├── customer/               # Customer API routes
│   │   │   └── campaigns/route.ts  # RLS-protected
│   │   └── admin/                  # Admin API routes
│   │
│   ├── signup/page.tsx             # Customer signup
│   ├── login/page.tsx              # Customer login
│   └── onboarding/
│       └── step-1/page.tsx         # Plan selection
│
├── lib/
│   ├── auth.ts                     # 🔑 Authentication utilities
│   ├── supabase.ts                 # Supabase client
│   └── ...
│
├── middleware.ts                   # 🛡️ Route protection
│
└── supabase/migrations/
    └── 007_add_authentication_system.sql  # 📊 Multi-tenant DB
```

---

**Architecture Complete!** 🎉

See `PHASE1-QUICK-START.md` to get running in 15 minutes.

