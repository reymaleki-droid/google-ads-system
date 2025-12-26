# Phase 1 - Remaining Setup Steps

## ✅ COMPLETED AUTOMATICALLY
1. ✅ Production deployment: https://google-ads-system.vercel.app
2. ✅ NEXTAUTH_URL environment variable added to Vercel
3. ✅ NEXTAUTH_SECRET generated and added to Vercel (encrypted)
4. ✅ CRON_SECRET verified as existing in Vercel
5. ✅ Application redeployed with new environment variables

---

## ⚠️ MANUAL STEPS REQUIRED (Cannot be automated)

### STEP 1: Apply Database Migration (CRITICAL - 5 minutes)

**File Location:** `c:\Users\Lenovo\Desktop\google-ads-system\supabase\migrations\007_add_authentication_system.sql`

**What it does:**
- Creates `user_roles` table for customer/admin authentication
- Adds `customer_id` column to all existing tables (leads, bookings, google_ads_*, attribution_events)
- Updates RLS policies for multi-tenant security
- Creates helper functions `is_admin()` and `is_customer()`

**Instructions:**

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **pidopvklxjmmlfutkrhd**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open the file: `supabase\migrations\007_add_authentication_system.sql`
6. Copy ALL 343 lines of SQL
7. Paste into the Supabase SQL Editor
8. Click **Run** button (or press Ctrl+Enter)
9. Wait for success message

**Verification:**
- Go to **Table Editor** → Look for `user_roles` table
- Check `leads` table → Should have new `customer_id` column

---

### STEP 2: Configure Google OAuth (CRITICAL - 10 minutes)

**Why this is needed:** Allows admin login via Google and customer portal authentication.

**Part A: Get Google OAuth Credentials**

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your project (or create new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application Type: **Web application**
6. Name: `Google Ads System`
7. Authorized redirect URIs (add both):
   ```
   https://pidopvklxjmmlfutkrhd.supabase.co/auth/v1/callback
   http://localhost:3000/api/auth/callback/google
   ```
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

**Part B: Configure in Supabase**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **pidopvklxjmmlfutkrhd**
3. Go to **Authentication** → **Providers** (left sidebar)
4. Find **Google** in the list
5. Toggle **Enable** switch to ON
6. Paste your **Client ID** from Part A
7. Paste your **Client Secret** from Part A
8. Click **Save**

**Part C: Add OAuth Redirect to Vercel Environment Variables**

Run these commands in PowerShell:

```powershell
cd C:\Users\Lenovo\Desktop\google-ads-system

# Add NextAuth callback URL
vercel env add NEXTAUTH_URL production
# When prompted, enter: https://google-ads-system.vercel.app

# Add Google OAuth credentials
vercel env add GOOGLE_CLIENT_ID production
# When prompted, paste the Client ID from Part A

vercel env add GOOGLE_CLIENT_SECRET production
# When prompted, paste the Client Secret from Part A
```

**Part D: Redeploy**

```powershell
vercel --prod
```

---

### STEP 3: Verify Everything Works (5 minutes)

**Test Authentication Flow:**

1. **Test Admin Login:**
   - Visit: https://google-ads-system.vercel.app/admin/login
   - Click "Sign in with Google"
   - Should redirect to Google login
   - After login, should redirect to `/admin/dashboard`

2. **Test Database:**
   - Check Supabase Dashboard → Table Editor
   - Verify `user_roles` table exists
   - After first Google login, you should see your user in `auth.users` table
   - Your role should be in `user_roles` table

3. **Test Customer Portal:**
   - Visit: https://google-ads-system.vercel.app/app/dashboard
   - Should require login
   - After login, should show customer dashboard

---

## 🔐 SECURITY NOTES

**Admin Role Assignment:**

After your first Google login, you need to manually assign yourself as admin:

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with your email):

```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@gmail.com';

-- Insert admin role (use the UUID from above)
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

**Customer Role Assignment:**

When a customer submits a lead form and creates an account, they automatically get `customer` role via the application logic.

---

## 🎯 COMPLETION CHECKLIST

- [ ] Step 1: Database migration applied in Supabase SQL Editor
- [ ] Step 2A: Google OAuth credentials obtained from Google Cloud Console
- [ ] Step 2B: Google OAuth enabled in Supabase Dashboard
- [ ] Step 2C: Environment variables added to Vercel (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [ ] Step 2D: Redeployed with `vercel --prod`
- [ ] Step 3: Tested admin login at /admin/login
- [ ] Step 3: Assigned admin role to your Google account
- [ ] Step 3: Verified customer portal at /app/dashboard

---

## 📞 TROUBLESHOOTING

**"Google OAuth not configured" error:**
- Verify redirect URIs in Google Cloud Console match exactly
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Vercel
- Redeploy after adding environment variables

**"User not authorized" after login:**
- Check `user_roles` table has your user_id with role='admin'
- Run the admin role assignment SQL query above

**Database migration fails:**
- Check if tables already exist: `SELECT * FROM user_roles LIMIT 1;`
- If already exists, migration already applied

**Cannot access admin dashboard:**
- Verify you're logged in with Google account
- Check middleware.ts is configured correctly
- Verify admin role in database

---

## 📚 ADDITIONAL RESOURCES

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Google OAuth Setup: https://support.google.com/cloud/answer/6158849
- NextAuth.js Docs: https://next-auth.js.org/
- Vercel Environment Variables: https://vercel.com/docs/environment-variables

---

**Status:** Environment variables configured, application deployed. **Manual steps required for database migration and OAuth setup.**

**Estimated Total Time:** 20 minutes

**Generated:** December 2025
