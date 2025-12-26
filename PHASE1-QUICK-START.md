# Phase 1 Quick Start Guide

## 🚀 Get Running in 15 Minutes

### Step 1: Install Dependencies (2 min)
```bash
cd c:\Users\Lenovo\Desktop\google-ads-system
npm install @supabase/auth-helpers-nextjs @supabase/ssr
```

### Step 2: Apply Database Migration (5 min)
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy contents of `supabase/migrations/007_add_authentication_system.sql`
4. Paste and click **Run**
5. Verify: `SELECT * FROM user_roles;` (should return empty table)

### Step 3: Configure Google OAuth (5 min)
1. Supabase Dashboard → **Authentication** → **Providers**
2. Click **Google** provider
3. Toggle **Enable**
4. Add credentials:
   - **Client ID:** (from Google Cloud Console)
   - **Client Secret:** (from Google Cloud Console)
5. Add redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
6. Click **Save**

### Step 4: Test Locally (3 min)
```bash
npm run dev
```

1. Visit: http://localhost:3000/signup
2. Click "Sign up with Google"
3. Authorize app
4. Should redirect to: http://localhost:3000/onboarding/step-1
5. ✅ Success! You're authenticated.

---

## 🧪 Quick Verification Tests

### Test 1: Authentication Works
```bash
# Open browser
http://localhost:3000/app/dashboard

# If not logged in → should redirect to /login
# If logged in → should show dashboard
```

### Test 2: Customer Portal Works
```bash
# After logging in, visit:
http://localhost:3000/app/campaigns
http://localhost:3000/app/alerts
http://localhost:3000/app/settings

# All should load without errors
```

### Test 3: RLS Isolation (Critical!)
```sql
-- In Supabase SQL Editor:

-- Create test customer (use your actual user_id from signup)
INSERT INTO user_roles (user_id, role)
VALUES ('paste-your-user-id-here', 'customer');

-- Create test lead for this customer
INSERT INTO leads (
  customer_id,
  full_name,
  email,
  phone_e164,
  goal_primary,
  monthly_budget_range,
  timeline,
  lead_score,
  lead_grade,
  recommended_package,
  consent
) VALUES (
  'paste-your-user-id-here',
  'Test Lead',
  'test@example.com',
  '+971501234567',
  'Test Goal',
  '2000-4999',
  'immediate',
  75,
  'A',
  'growth',
  true
);

-- Visit http://localhost:3000/app/dashboard
-- Should see your test lead in stats
```

---

## 🔧 Troubleshooting

### "Cannot find module '@supabase/ssr'"
```bash
npm install @supabase/ssr @supabase/auth-helpers-nextjs
```

### "Unauthorized" on pages
1. Check cookies are enabled
2. Sign out: http://localhost:3000/auth/signout (POST)
3. Sign in again

### "Admin portal requires admin role"
```sql
-- Grant admin role to your user
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Get your user ID
1. Sign up/login
2. Open browser DevTools (F12)
3. Console tab:
```javascript
// Get current user ID
const { data } = await supabase.auth.getUser();
console.log(data.user.id);
```

---

## 📋 What's Working Now

✅ **Pages:**
- `/signup` - Customer signup
- `/login` - Customer login
- `/admin/login` - Admin login
- `/app/dashboard` - Customer dashboard
- `/app/campaigns` - Campaign list
- `/app/alerts` - Alerts center
- `/app/integrations` - Google Ads connection
- `/app/settings` - Account settings
- `/onboarding/step-1` - Plan selection

✅ **API Routes:**
- `/auth/callback` - OAuth handler
- `/auth/signout` - Sign out
- `/api/customer/campaigns` - RLS-protected campaigns (GET/POST)

✅ **Security:**
- RLS enforced on all tables
- Customer data isolation
- Admin full access
- Middleware route protection

---

## 🎯 Next Steps

1. **Create your first admin user:**
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('your-user-id', 'admin');
   ```

2. **Test customer isolation:**
   - Create 2 test accounts
   - Add leads to both
   - Verify each only sees their own data

3. **Connect Google Ads:**
   - Visit `/app/integrations`
   - Click "Connect Google Ads"
   - Authorize account

4. **Review implementation guide:**
   - See `PHASE1-IMPLEMENTATION-GUIDE.md` for detailed docs
   - See `PHASE1-COMPLETION-REPORT.md` for what's ready

---

## 📞 Need Help?

**Check these files:**
- `PHASE1-IMPLEMENTATION-GUIDE.md` - Full deployment guide
- `PHASE1-COMPLETION-REPORT.md` - What's complete & what's next
- `lib/auth.ts` - Authentication utilities
- `middleware.ts` - Route protection logic

**Common commands:**
```bash
# Start dev server
npm run dev

# Check database
supabase db diff

# Reset auth (if testing)
# Delete user from Supabase Dashboard → Authentication → Users
```

---

**Ready to Go!** 🚀

Next: Complete onboarding flow or refactor existing API routes. See `PHASE1-COMPLETION-REPORT.md` for roadmap.

