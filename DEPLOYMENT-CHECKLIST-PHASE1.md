# Phase 1 Deployment Checklist

**Ready to Deploy:** December 27, 2025  
**Estimated Time:** 30-45 minutes

---

## ✅ Pre-Deployment Checklist

### 1. Dependencies Installed
```bash
npm install @supabase/auth-helpers-nextjs @supabase/ssr
```
- [ ] Packages installed successfully
- [ ] No dependency errors
- [ ] `package.json` updated

### 2. Database Migration Applied
```bash
# Copy contents of supabase/migrations/007_add_authentication_system.sql
# Paste into Supabase SQL Editor
# Click "Run"
```
- [ ] Migration executed without errors
- [ ] `user_roles` table exists
- [ ] All tables have `customer_id` column
- [ ] RLS policies created
- [ ] Triggers created
- [ ] Helper functions created

### 3. Verify Migration Success
```sql
-- Run in Supabase SQL Editor

-- Check user_roles table
SELECT * FROM user_roles;
-- Should return empty table (no errors)

-- Check customer_id column exists
SELECT customer_id FROM leads LIMIT 1;
-- Should return NULL or UUID (no column error)

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'leads';
-- Should show rowsecurity = true

-- Check helper function exists
SELECT is_customer('00000000-0000-0000-0000-000000000000');
-- Should return boolean (no function error)
```
- [ ] All queries execute successfully
- [ ] No errors in Supabase logs

### 4. Google OAuth Configured
```
Supabase Dashboard → Authentication → Providers → Google
```
- [ ] Google provider enabled
- [ ] Client ID added
- [ ] Client Secret added
- [ ] Redirect URLs configured:
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://yourdomain.com/auth/callback`
- [ ] Saved successfully

### 5. Local Testing Complete
```bash
npm run dev
```
- [ ] Signup flow works (`/signup`)
- [ ] Login flow works (`/login`)
- [ ] Admin login works (`/admin/login`)
- [ ] Customer pages load (`/app/dashboard`, `/app/campaigns`)
- [ ] Sign out works (`/auth/signout`)
- [ ] No console errors

### 6. Authentication Testing
- [ ] Can sign up with Google
- [ ] Redirected to `/onboarding/step-1` after signup
- [ ] Can login with existing account
- [ ] Redirected to `/app/dashboard` after login
- [ ] Session persists across page refreshes
- [ ] Sign out clears session properly

### 7. RLS Testing
```sql
-- Create test customer
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id', 'customer');

-- Create test lead
INSERT INTO leads (
  customer_id, full_name, email, phone_e164,
  goal_primary, monthly_budget_range, timeline,
  lead_score, lead_grade, recommended_package, consent
) VALUES (
  'your-user-id', 'Test Lead', 'test@example.com', '+971501234567',
  'Test', '2000-4999', 'immediate',
  75, 'A', 'growth', true
);
```
- [ ] Customer can see their own lead in `/app/dashboard`
- [ ] Customer cannot see other customers' leads
- [ ] Public lead form still works (no customer_id set)

### 8. API Route Testing
```bash
# Test public lead submission (no auth)
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com",...}'

# Test authenticated lead submission (with cookie)
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-auth-token=..." \
  -d '{"email":"customer@example.com",...}'
```
- [ ] Public lead submission works
- [ ] Authenticated lead submission works
- [ ] customer_id set correctly based on auth state

---

## 🚀 Deployment Steps

### Step 1: Push Code to Git
```bash
git add -A
git commit -m "Phase 1: Add authentication & multi-tenancy"
git push origin main
```

### Step 2: Deploy to Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or trigger deployment via Vercel Dashboard
# (automatic if connected to GitHub)
```

### Step 3: Verify Production Environment
- [ ] Vercel deployment succeeded
- [ ] No build errors
- [ ] Environment variables present:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Update Google OAuth Redirect
```
Google Cloud Console → APIs & Services → Credentials
```
- [ ] Add production URL to authorized redirect URIs:
  - `https://yourdomain.com/auth/callback`
- [ ] Update in Supabase as well:
  - Supabase → Authentication → URL Configuration
  - Add `https://yourdomain.com` to allowed URLs

### Step 5: Create First Admin User
```sql
-- Run in Supabase SQL Editor (Production)

-- Replace with your actual user_id after signup
INSERT INTO user_roles (user_id, role)
VALUES ('your-production-user-id', 'admin');
```
- [ ] Admin user created
- [ ] Can access `/admin` routes

### Step 6: Production Testing
```bash
# Visit production URL
https://yourdomain.com
```
- [ ] Homepage loads correctly
- [ ] Sign up with Google works
- [ ] Login works
- [ ] Customer portal accessible
- [ ] Admin portal accessible (for admin users)
- [ ] Public forms still work
- [ ] No JavaScript errors in console

### Step 7: RLS Verification (Production)
```sql
-- Create test data in production
-- Verify data isolation works correctly
```
- [ ] Customer A cannot see Customer B's data
- [ ] Admin can see all data
- [ ] Public leads have NULL customer_id

---

## ⚠️ Critical Security Checks

### Before Going Live

1. **RLS Policies Active**
```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- All should show rowsecurity = true
```
- [ ] RLS enabled on all customer data tables

2. **Service Role Key Protected**
```bash
# Check environment variables
echo $SUPABASE_SERVICE_ROLE_KEY
# Should be set in Vercel, NOT in client code
```
- [ ] Service role key not exposed to client
- [ ] Only used in API routes
- [ ] Not in Git repository

3. **Authentication Required**
```bash
# Try accessing customer pages without auth
curl https://yourdomain.com/app/dashboard
# Should redirect to /login
```
- [ ] `/app/*` routes protected
- [ ] `/admin/*` routes protected
- [ ] Unauthenticated users redirected

4. **Admin Access Restricted**
```sql
-- Verify only admins have admin role
SELECT * FROM user_roles WHERE role = 'admin';
```
- [ ] Only authorized users have admin role
- [ ] No accidental admin assignments

---

## 🧪 Post-Deployment Testing

### Test Scenarios

**Scenario 1: New Customer Signup**
1. Visit `/signup`
2. Sign up with Google
3. Redirected to `/onboarding/step-1`
4. Choose plan
5. Verify user created in Supabase
6. Check `user_roles` has customer role
- [ ] PASS / FAIL: _______

**Scenario 2: Existing Customer Login**
1. Visit `/login`
2. Sign in with Google
3. Redirected to `/app/dashboard`
4. See personalized dashboard
- [ ] PASS / FAIL: _______

**Scenario 3: Customer Data Isolation**
1. Login as Customer A
2. Visit `/app/campaigns`
3. Only see Customer A's campaigns
4. Cannot access Customer B's data via API
- [ ] PASS / FAIL: _______

**Scenario 4: Admin Access**
1. Login as admin user
2. Visit `/admin/leads`
3. See all customers' leads
4. Can filter by customer
- [ ] PASS / FAIL: _______

**Scenario 5: Public Forms**
1. Logout (anonymous user)
2. Visit `/free-audit`
3. Submit lead form
4. Booking flow works
5. No authentication required
- [ ] PASS / FAIL: _______

---

## 🔄 Rollback Plan

### If Issues Found Post-Deployment

**Step 1: Revert Code (Quick)**
```bash
git revert HEAD
git push origin main
# Vercel will auto-deploy previous version
```

**Step 2: Disable Auth (Temporary)**
```typescript
// In middleware.ts
export async function middleware(request: NextRequest) {
  // TEMPORARILY BYPASS AUTH
  return NextResponse.next();
}
```

**Step 3: Database Rollback (If Needed)**
```sql
-- Remove customer_id columns (CAUTION: data loss)
ALTER TABLE leads DROP COLUMN customer_id;
ALTER TABLE bookings DROP COLUMN customer_id;
-- etc.
```
⚠️ **Only use if absolutely necessary - causes data loss**

---

## 📊 Monitoring Checklist

### What to Monitor Post-Deployment

**Application Metrics:**
- [ ] Error rate (should be <1%)
- [ ] Response time (<500ms for most routes)
- [ ] Successful authentications (track signup/login)
- [ ] Failed authentication attempts (security)

**Database Metrics:**
- [ ] Query performance (should be similar to before)
- [ ] RLS overhead (minimal impact expected)
- [ ] Connection pool usage

**User Behavior:**
- [ ] Signup conversion rate
- [ ] Login success rate
- [ ] Customer portal engagement
- [ ] Public form submissions still working

### Set Up Alerts

**Vercel/Monitoring Service:**
- [ ] Error rate alert (>5% failures)
- [ ] Response time alert (>2s P95)
- [ ] Deploy failure alert

**Supabase:**
- [ ] Database CPU alert (>80%)
- [ ] API quota alert (approaching limits)
- [ ] Auth failure spike alert

---

## ✅ Final Checklist

Before marking deployment complete:

- [ ] All dependencies installed
- [ ] Database migration applied successfully
- [ ] Google OAuth configured in production
- [ ] Code deployed to production
- [ ] First admin user created
- [ ] Production testing passed (5/5 scenarios)
- [ ] RLS policies verified active
- [ ] No security issues found
- [ ] Monitoring set up
- [ ] Rollback plan documented
- [ ] Team notified of changes

---

## 📞 Support & Next Steps

### If You Need Help

**Check Documentation:**
- `PHASE1-QUICK-START.md` - 15-minute setup guide
- `PHASE1-IMPLEMENTATION-GUIDE.md` - Full deployment guide
- `PHASE1-ARCHITECTURE.md` - System architecture
- `API-ROUTES-UPDATED.md` - API changes

**Common Issues:**
- Authentication loop → Clear cookies, check Supabase URL
- RLS blocking data → Verify using service_role in API routes
- Customer can't see data → Check customer_id is set correctly

### Post-Deployment Tasks (Week 2)

1. **Complete onboarding flow:**
   - Step 2: Connect Google Ads
   - Step 3: First campaign setup

2. **Build admin features:**
   - Customer list page
   - Customer detail page
   - Role management interface

3. **Add customer features:**
   - Campaign creation
   - Alert configuration
   - Billing integration

4. **Enhance security:**
   - Add 2FA for admin accounts
   - Implement session timeout
   - Add audit logging

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** December 27, 2025  
**Ready for Production:** ✅ Yes (with testing)

