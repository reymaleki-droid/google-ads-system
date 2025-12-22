# Google Ads Management System - Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run this:

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  city TEXT,
  goal_primary TEXT NOT NULL,
  monthly_budget_range TEXT NOT NULL,
  response_within_5_min BOOLEAN NOT NULL,
  decision_maker BOOLEAN NOT NULL,
  timeline TEXT NOT NULL,
  recommended_package TEXT NOT NULL,
  lead_score INTEGER NOT NULL,
  lead_grade TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  consent BOOLEAN NOT NULL,
  raw_answers JSONB
);

CREATE INDEX idx_leads_grade ON leads(lead_grade);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

4. Go to **Settings > API** and copy:
   - Project URL
   - `anon` `public` key

### Step 3: Configure Environment

Edit `.env.local` and replace with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key-here

ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
```

### Step 4: Update Contact Info

Edit `components/Footer.tsx` (lines 6-7):
```typescript
const phoneNumber = '+1234567890'; // Your real phone
const whatsappNumber = '+1234567890'; // Your WhatsApp
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing Your Setup

### Test the Website
1. Visit `http://localhost:3000` - Should see the home page
2. Click "Get Free Audit" - Should open the form
3. Fill out and submit the form
4. You should be redirected to thank you page

### Test the Admin Dashboard
1. Visit `http://localhost:3000/admin`
2. Login with credentials from `.env.local`
3. You should see your submitted lead

### Test Lead Scoring

Submit a form with these values for **Grade A** lead:
- Budget: $5,000+
- Decision maker: Yes
- Can respond in 5 min: Yes
- Add a website URL
- Timeline: Immediately

Should show recommended package: **Scale**

## Ready to Deploy?

See the main [README.md](README.md) for deployment instructions.

## Need Help?

Check these files:
- `README.md` - Full documentation
- `.env.example` - Environment variable reference
- `lib/lead-scoring.ts` - Scoring logic

## Common Issues

**"Supabase connection failed"**
- Check your URL and key in `.env.local`
- Make sure table is created

**"Admin login doesn't work"**
- Check credentials in `.env.local`
- Try private/incognito browser

**"Form submission fails"**
- Open browser console (F12)
- Check the Network tab for errors
- Verify Supabase table exists

---

🎉 You're all set! Start customizing your site.
