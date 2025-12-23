# Vercel Environment Variables - Quick Setup Guide

## ✅ Required Variables Checklist

Copy these exact variable names and paste your values:

### 1. Supabase Database (3 variables)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 2. Email Service (1 variable)
```
RESEND_API_KEY
```
Get your API key from: https://resend.com/api-keys

### 3. Cron Security (1 variable)
```
CRON_SECRET
```
Generate a random string (32+ characters).
Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## 📝 Step-by-Step: How to Add Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Log in if needed
3. Click on your **google-ads-system** project

### Step 2: Open Environment Variables Settings
1. Click **Settings** (top menu bar)
2. Click **Environment Variables** (left sidebar)

### Step 3: Add Each Variable (Repeat 5 Times)

For each of the 5 required variables:

1. Click the **"Add New"** button
2. Fill in the form:
   - **Key**: Copy/paste the variable name (e.g., `RESEND_API_KEY`)
   - **Value**: Paste your actual value (no quotes needed)
   - **Environments**: Check **ALL** boxes:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
3. Click **"Save"**
4. Repeat for the next variable

### Step 4: Verify All 5 Variables Are Added

You should see these in your list:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ RESEND_API_KEY
- ✅ CRON_SECRET

### Step 5: Redeploy
1. Click **"Deployments"** tab (top)
2. Find the latest deployment
3. Click the **"⋯"** (three dots) menu
4. Click **"Redeploy"**
5. Wait 2-3 minutes for deployment to complete

### Step 6: Check Deployment Logs
1. Click on the completed deployment
2. Look for this message in logs:
   ```
   ✅ All required environment variables are set
   ```
3. If you see ❌ errors, double-check your variable names and values

---

## 🔐 How to Generate CRON_SECRET

### Option 1: Use Your Terminal
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Use Online Generator
Visit: https://generate-secret.vercel.app/32

### Option 3: Make Your Own
Create a random string with letters and numbers, at least 32 characters.
Example: `my_super_secret_cron_key_2025_abc123xyz`

---

## ⚠️ Common Mistakes to Avoid

❌ **Don't** add quotes around values
- Wrong: `"re_abc123"`
- Right: `re_abc123`

❌ **Don't** add extra spaces
- Wrong: ` RESEND_API_KEY` (space before)
- Right: `RESEND_API_KEY`

❌ **Don't** forget to select all environments
- Must check: Production, Preview, Development

❌ **Don't** forget to redeploy after adding variables
- Variables only take effect after redeployment

---

## 🆘 Troubleshooting

### "Deployment Failed"
1. Go to Deployments → Click failed deployment
2. Read the error message
3. Check if any variable names have typos
4. Verify all 5 required variables are set
5. Redeploy after fixing

### "Emails Not Sending"
1. Check `RESEND_API_KEY` is valid
2. Log in to Resend: https://resend.com/api-keys
3. Create a new API key if needed
4. Update the variable in Vercel
5. Redeploy

### "Cron Job Not Working"
1. Verify `CRON_SECRET` is set
2. Check it has no spaces before/after
3. Redeploy
4. Wait 10 minutes and check cron logs

---

## 📞 Need Help?

If you're stuck:
1. Screenshot the Vercel error message
2. Check you followed all steps exactly
3. Verify variable names match exactly (case-sensitive)
4. Make sure you clicked "Save" for each variable
5. Confirm you redeployed after adding variables

---

## ✨ Optional: Google Calendar Integration

If you want calendar sync and Meet links, also add these 3 variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/google/callback
```

**Note:** The app works fine without these. They're only needed for calendar sync.