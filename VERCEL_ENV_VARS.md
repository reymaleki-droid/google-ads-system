# Vercel Environment Variables

**Complete list of environment variables required for production deployment.**

---

## ✅ REQUIRED Environment Variables

These MUST be set in Vercel or the application will not work:

```bash
# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pidopvklxjmmlfutkrhd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZG9wdmtseGptbWxmdXRrcmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDE5NTQsImV4cCI6MjA4MTk3Nzk1NH0.j3Gf1T2MKe_JLtPBdMm_hs-PL8r2fmWC7AiHs8VDbyk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZG9wdmtseGptbWxmdXRrcmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQwMTk1NCwiZXhwIjoyMDgxOTc3OTU0fQ.TaDzgSun5y5O9RKNh3IKU3XFSVq73MSQUMJW_cV3QMk

# Resend Email Service
RESEND_API_KEY=re_123456789_YourResendAPIKeyHere

# Cron Job Security
CRON_SECRET=your_random_secret_string_here_minimum_32_characters
```

### Where Each Variable is Used:

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All API routes, client-side | Supabase database connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & API routes | Public database access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server API routes | Admin database access |
| `RESEND_API_KEY` | `lib/email.ts` | Sending booking confirmation & reminder emails |
| `CRON_SECRET` | `app/api/cron/reminders/route.ts` | Authenticating Vercel Cron requests |

---

## ⚙️ OPTIONAL Environment Variables

These enable Google Calendar integration (calendar sync + Meet links):

```bash
# Google OAuth (for Calendar Integration)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/google/callback
```

### Where Optional Variables are Used:

| Variable | Used In | Purpose |
|----------|---------|---------|
| `GOOGLE_CLIENT_ID` | `lib/google.ts` | Google OAuth authentication |
| `GOOGLE_CLIENT_SECRET` | `lib/google.ts` | Google OAuth authentication |
| `GOOGLE_REDIRECT_URI` | `lib/google.ts` | OAuth callback URL |

**Note:** If Google variables are not set, bookings will still work but without calendar sync.

---

## 🚫 NOT REQUIRED

- ~~`BASE_URL`~~ - **Not needed!** The app automatically derives the URL from request headers.

---

## 📋 Step-by-Step Setup Instructions

### For Non-Developers: How to Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Log in to your account

2. **Select Your Project**
   - Click on your `google-ads-system` project

3. **Open Settings**
   - Click **Settings** (top navigation bar)
   - Click **Environment Variables** (left sidebar)

4. **Add Each Variable**
   For each variable listed above:
   - Click **Add New** button
   - Enter the **Name** (e.g., `RESEND_API_KEY`)
   - Enter the **Value** (copy from this document)
   - Select **All Environments** (Production, Preview, Development)
   - Click **Save**

5. **Repeat for All Required Variables**
   Add these 5 required variables:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `RESEND_API_KEY`
   - ✅ `CRON_SECRET`

6. **Optional: Add Google Calendar Variables**
   Only if you want calendar integration:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

7. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete (2-3 minutes)

8. **Verify**
   - Check the deployment logs for: `✅ All required environment variables are set`
   - If you see `❌ MISSING REQUIRED ENVIRONMENT VARIABLES`, repeat steps 4-7

---

## 🔐 How to Generate CRON_SECRET

```bash
# Run this command in your terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use this online tool: https://generate-secret.vercel.app/32

Copy the generated string and use it as `CRON_SECRET`.

---

## 🔍 Troubleshooting

### If Deployment Fails:

1. **Check for typos**
   - Variable names are CASE-SENSITIVE
   - No extra spaces before/after values
   - No quotes around values (Vercel adds them automatically)

2. **Verify all required variables are set**
   - Go to Settings → Environment Variables
   - Confirm all 5 required variables exist

3. **Check deployment logs**
   - Go to Deployments → Click on failed deployment
   - Look for specific error messages

4. **Redeploy after fixing**
   - After correcting any issues, always redeploy

### If Emails Don't Send:

- Check that `RESEND_API_KEY` is valid
- Verify in Resend Dashboard: https://resend.com/api-keys
- Check deployment logs for email errors

### If Cron Reminders Don't Work:

- Verify `CRON_SECRET` is set in Vercel
- Check that `vercel.json` has the cron configuration
- View cron logs: Vercel Dashboard → Project → Cron

---

## 📝 Summary Checklist

Before deploying to production:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set
- [ ] `RESEND_API_KEY` - Set with valid Resend key
- [ ] `CRON_SECRET` - Set with random 32+ character string
- [ ] Optional: Google OAuth variables (if you want calendar sync)
- [ ] All variables set for **All Environments**
- [ ] Redeployed after adding variables
- [ ] Verified logs show ✅ success messages
