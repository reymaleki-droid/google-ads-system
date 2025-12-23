# OTP Phone Verification - Manual Setup Instructions

## ⚠️ I Cannot Directly Connect to Supabase

I don't have authentication access to execute SQL on your Supabase database remotely. However, I've prepared everything you need to do it yourself in **2 minutes**.

---

## ✅ What I've Already Done For You:

1. ✅ **Created migration SQL file**: `supabase/APPLY_OTP_MIGRATION_NOW.sql`
2. ✅ **Updated .env.local**: `ENFORCE_PHONE_VERIFICATION=true`
3. ✅ **All code is ready**: API endpoints, components, utilities
4. ✅ **Created verification scripts**
5. ✅ **Created step-by-step guide**: `RUN_THIS_IN_SUPABASE.md`

---

## 🚀 What YOU Need to Do (2 minutes):

### Step 1: Open Supabase Dashboard (30 seconds)

Click this link:
```
https://supabase.com/dashboard/project/pidopvklxjmmlfutkrhd/sql/new
```

### Step 2: Copy & Paste SQL (1 minute)

1. Open file: `supabase/APPLY_OTP_MIGRATION_NOW.sql`
2. Press `Ctrl+A` (select all)
3. Press `Ctrl+C` (copy)
4. Go back to Supabase SQL Editor
5. Press `Ctrl+V` (paste)
6. Click **"Run"** button (bottom right)

### Step 3: Wait for Success Message (10 seconds)

You should see:
```
============================================
OTP MIGRATION VERIFICATION REPORT
============================================
phone_verifications table: ✅ EXISTS
leads.phone_verified_at column: ✅ EXISTS
Indexes created: 6 (expected: 6)
RLS policies: 2 (expected: 2)
============================================
✅ OTP PHONE VERIFICATION SETUP COMPLETE!
```

---

## 🧪 Then Test It:

### Option A: Quick Test

```powershell
npm run dev
```

Then:
1. Go to: http://localhost:3000/free-audit
2. Fill form with phone: `+14155552671`
3. Go to: http://localhost:3000/schedule
4. Select time slot → Click "Confirm Booking"
5. **OTP Modal appears!**
6. Check terminal for: `[Development Mode] OTP Code: 123456`
7. Enter code → Success!

### Option B: Verify with Script

After running the SQL, you can verify with:
```powershell
npm run verify:otp
```

---

## 📊 Current Status:

### ✅ Ready (Code):
- OTP send/verify API endpoints
- OTPModal component (10 UI states)
- SMS provider abstraction
- Rate limiting
- Security logging
- Booking integration

### ⏳ Pending (Database):
- `phone_verifications` table (needs SQL execution)
- `leads.phone_verified_at` column (needs SQL execution)

### ✅ Configured:
- `.env.local`: `ENFORCE_PHONE_VERIFICATION=true`
- `.env.local`: `SMS_PROVIDER=mock`

---

## ❓ Why Can't I Run It For You?

Supabase security (correctly) prevents remote SQL execution. You must:
1. Be logged into Supabase Dashboard
2. Have project permissions
3. Manually execute SQL in their web interface

This is a **good security practice** - it prevents unauthorized database modifications.

---

## 🎯 The ONE Thing You Must Do:

**Copy `supabase/APPLY_OTP_MIGRATION_NOW.sql` into Supabase SQL Editor and click Run.**

That's it! Everything else is already configured and ready.

---

## 📞 After You Run It:

Tell me "done" and I'll help you test the OTP flow end-to-end!

