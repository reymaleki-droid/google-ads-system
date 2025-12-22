# 🚀 Quick Reference Guide

## Commands

```bash
# Install dependencies
npm install

# Check if setup is complete
npm run check-setup

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## URLs (Development)

| Page | URL |
|------|-----|
| Home | http://localhost:3000 |
| Google Ads | http://localhost:3000/google-ads |
| Packages | http://localhost:3000/google-ads/packages |
| Case Studies | http://localhost:3000/case-studies |
| Free Audit | http://localhost:3000/free-audit |
| Thank You | http://localhost:3000/thank-you |
| Admin Dashboard | http://localhost:3000/admin |
| Lead Detail | http://localhost:3000/admin/leads/[id] |

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# Admin Login
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
```

## File Locations

### Need to customize?

| What | File Path |
|------|-----------|
| Phone/WhatsApp | `components/Footer.tsx` |
| Packages | `app/google-ads/packages/page.tsx` |
| Case Studies | `data/case-studies.json` |
| Scoring Rules | `lib/lead-scoring.ts` |
| Form Fields | `app/free-audit/page.tsx` |
| Home Page | `app/page.tsx` |
| Header/Nav | `components/Header.tsx` |

## Lead Scoring Cheat Sheet

| Criteria | Points |
|----------|--------|
| Budget ≥ $5,000 | +25 |
| Budget $2,000-4,999 | +15 |
| Budget $1,000-1,999 | +5 |
| Decision Maker: Yes | +20 |
| Respond in 5 min: Yes | +15 |
| Has Website | +10 |
| Timeline: Immediate | +10 |
| Timeline: 2 weeks | +5 |

**Grades:**
- A: 75+ (Scale Package)
- B: 55-74 (Growth Package)
- C: 35-54 (Starter Package)
- D: <35 (Starter Package)

## Database Schema (Quick)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contact
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  
  -- Business
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  city TEXT,
  
  -- Campaign
  goal_primary TEXT NOT NULL,
  monthly_budget_range TEXT NOT NULL,
  timeline TEXT NOT NULL,
  
  -- Qualification
  response_within_5_min BOOLEAN NOT NULL,
  decision_maker BOOLEAN NOT NULL,
  consent BOOLEAN NOT NULL,
  
  -- Scoring
  lead_score INTEGER NOT NULL,
  lead_grade TEXT NOT NULL,
  recommended_package TEXT NOT NULL,
  
  -- Management
  status TEXT DEFAULT 'new',
  raw_answers JSONB
);

-- Indexes
CREATE INDEX idx_leads_grade ON leads(lead_grade);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

## Common Tasks

### Change Admin Password
1. Edit `.env.local`
2. Update `ADMIN_PASSWORD=new-password`
3. Restart dev server

### Add a Case Study
1. Edit `data/case-studies.json`
2. Add new object to array
3. Follow existing format

### Change Package Pricing
1. Edit `app/google-ads/packages/page.tsx`
2. Find `packages` array (line ~8)
3. Update `price` and `features`

### Modify Form Fields
1. Edit `app/free-audit/page.tsx`
2. Add/remove fields in JSX
3. Update TypeScript type in `lib/lead-scoring.ts`
4. Update scoring logic if needed

### View All Leads in Supabase
```sql
SELECT * FROM leads ORDER BY created_at DESC;
```

### Export Grade A Leads
```sql
SELECT full_name, email, phone, company_name, lead_score
FROM leads
WHERE lead_grade = 'A'
ORDER BY lead_score DESC;
```

## Tracking Events

### Listen for Events

```javascript
// In your analytics script
window.addEventListener('lead_submit', (e) => {
  console.log('Lead submitted:', e.detail);
  // Send to your analytics platform
});

window.addEventListener('phone_click', (e) => {
  console.log('Phone clicked:', e.detail);
});

window.addEventListener('whatsapp_click', (e) => {
  console.log('WhatsApp clicked:', e.detail);
});
```

## Admin Dashboard

**Default Login:**
- Username: `admin` (or from .env)
- Password: (from .env.local)

**Lead Statuses:**
- `new` - Just submitted
- `contacted` - You've reached out
- `qualified` - Meets criteria
- `converted` - Became a customer
- `unqualified` - Not a fit

## Troubleshooting

### "Cannot connect to Supabase"
- ✅ Check `.env.local` has correct URL and key
- ✅ Verify table `leads` exists
- ✅ Check Supabase project is active

### "Admin login fails"
- ✅ Check credentials in `.env.local`
- ✅ Try private/incognito browser
- ✅ Clear browser cache

### "Form won't submit"
- ✅ Open browser DevTools (F12)
- ✅ Check Console for errors
- ✅ Check Network tab
- ✅ Verify Supabase connection

### "npm install fails"
- ✅ Node.js 18+ installed?
- ✅ Try: `npm cache clean --force`
- ✅ Delete `node_modules` and retry

## Important Notes

⚠️ **Before Production:**
1. Change admin password
2. Update contact info in Footer
3. Add real Supabase credentials
4. Test lead submission end-to-end
5. Review DEPLOYMENT.md checklist

⚠️ **Security:**
- Never commit `.env.local` to git
- Use strong admin password
- Enable HTTPS in production
- Consider adding rate limiting

## Support Files

- 📖 `README.md` - Full documentation
- 🚀 `SETUP.md` - Quick start (5 min)
- ✅ `DEPLOYMENT.md` - Pre-launch checklist
- 🏗️ `ARCHITECTURE.md` - System diagrams
- 📊 `PROJECT-SUMMARY.md` - Complete overview
- 💾 `supabase-queries.sql` - Useful queries

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```

Don't forget to add environment variables in the hosting platform!

---

## Need More Help?

1. Check `README.md` for detailed docs
2. See `SETUP.md` for setup steps
3. Review troubleshooting sections
4. Check the GitHub issues (if applicable)

---

**Built with:** Next.js 15, TypeScript, TailwindCSS, Supabase

**License:** MIT
