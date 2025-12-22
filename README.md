# Google Ads Management Website - MVP

A complete marketing website for Google Ads management services with lead qualification, scoring, and admin dashboard.

## Features

✅ **Marketing Pages**
- Home page with hero, benefits, and social proof
- Google Ads service page with detailed offerings
- Packages page with 3 tiers (Starter, Growth, Scale)
- Case studies showcase (6 real examples)
- Free audit qualification form
- Thank you page with personalized package recommendations

✅ **Lead Management**
- Advanced lead scoring system (A/B/C/D grades)
- Automatic package recommendation based on score
- Supabase integration for lead storage
- Admin dashboard with filtering and search

✅ **Admin Dashboard**
- Protected by Basic Authentication
- View all leads with filtering by grade/status
- Individual lead detail pages
- Status management (new, contacted, qualified, converted, unqualified)
- Lead scoring breakdown

✅ **Tracking & Analytics**
- Custom JavaScript events for analytics integration
- Track lead submissions, phone clicks, WhatsApp clicks
- Easy integration with Google Tag Manager, Facebook Pixel, etc.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Basic Auth for admin
- **Deployment Ready:** Vercel, Netlify, or any Node.js host

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn package manager

## Setup Instructions

⚠️ **Important:** The Supabase project and database table already exist. You only need to configure environment variables.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The project is already configured to work with the existing Supabase database.

**Current Configuration:**
- Supabase URL: `https://pidopvklxjmmlfutkrhd.supabase.co`
- Database table: `leads` (already created)
- All required columns are set up with proper indexes and RLS policies

**Environment file (`.env.local`)** is already configured with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://pidopvklxjmmlfutkrhd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_q0II73fGzz8r9QSSHx6lig_x8Dnw0j4

# Admin Dashboard Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
```

⚠️ **Security Note:** Change the `ADMIN_PASSWORD` before deploying to production!

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Google Calendar Integration Setup (Optional)

To enable automatic calendar event creation with Google Meet links:

#### 4.1. Add Google OAuth Credentials to .env.local

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Supabase Service Role Key (get from Supabase Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### 4.2. Create google_tokens Table in Supabase

Run the SQL migration in Supabase SQL Editor:

```bash
# File: supabase/migrations/google_tokens.sql
```

Copy and paste the contents of [supabase/migrations/google_tokens.sql](supabase/migrations/google_tokens.sql) into your Supabase SQL Editor and execute.

#### 4.3. Connect Google Calendar

1. Start dev server: `npm run dev`
2. Visit: [http://localhost:3000/api/google/auth](http://localhost:3000/api/google/auth)
3. Sign in with your Google account
4. Grant calendar permissions
5. You'll be redirected to `/admin/integrations?google=connected`
6. Verify in Supabase Table Editor → `google_tokens` table
7. Confirm `refresh_token` is saved

#### 4.4. Test Calendar Integration

After connecting Google:
- Submit a booking through `/free-audit` → `/schedule`
- The system will automatically create a Google Calendar event with Meet link
- Customer receives email invitation with meeting details

**Important Notes:**
- If you see "No refresh token received", revoke app permissions in your Google Account settings and reconnect
- The `refresh_token` is stored securely server-side only
- Access tokens are automatically refreshed when expired

## How to Test

### Step 1: Start the server
```bash
npm run dev
```

### Step 2: Submit the /free-audit form
1. Visit http://localhost:3000
2. Click "Get Free Audit" button
3. Fill out the form completely (all required fields)
4. Make sure to check the consent checkbox
5. Click "Submit"

### Step 3: Check Table Editor → leads
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor** in the left sidebar
4. Select the `leads` table
5. You should see your test lead with:
   - Calculated `lead_score` (0-100)
   - Assigned `lead_grade` (A, B, C, or D)
   - Recommended package (starter, growth, or scale)
   - All form data saved
   - Status set to "new"

**What happens when you submit:**
1. Form validates email format and required fields
2. Server calculates lead score based on:
   - Monthly budget (0-25 points)
   - Decision maker status (20 points)
   - Response time preference (15 points)
   - Website URL presence (10 points)
   - Timeline urgency (0-10 points)
3. Grade assigned: A (≥75), B (55-74), C (35-54), D (<35)
4. Package recommended: A→scale, B→growth, C/D→starter
5. Lead saved to Supabase with all data
6. You're redirected to thank-you page with personalized recommendation

```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Admin Dashboard Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
```

⚠️ **Important:** Change the admin password before deploying to production!

### 4. Update Contact Information

Edit `components/Footer.tsx` and update:
- Phone number
- WhatsApp number

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Lead Scoring Logic

The system automatically calculates lead scores based on these criteria:

| Criteria | Points |
|----------|--------|
| Budget ≥ $5,000/month | +25 |
| Budget $2,000-$4,999/month | +15 |
| Budget $1,000-$1,999/month | +5 |
| Decision maker: Yes | +20 |
| Can respond within 5 min: Yes | +15 |
| Has website URL | +10 |
| Timeline: Immediate | +10 |
| Timeline: Within 2 weeks | +5 |

### Lead Grades
- **Grade A:** Score ≥ 75 (Highest priority)
- **Grade B:** Score 55-74 (Good quality)
- **Grade C:** Score 35-54 (Medium priority)
- **Grade D:** Score < 35 (Low priority)

### Package Recommendations
- **Scale Package:** Score ≥ 75
- **Growth Package:** Score 55-74
- **Starter Package:** Score < 55

## Admin Dashboard

Access the admin dashboard at `/admin`

**Default Credentials:**
- Username: `admin`
- Password: (set in your `.env` file)

### Features:
- View all leads with filters
- Sort by grade (A/B/C/D)
- Filter by status (new, contacted, qualified, converted, unqualified)
- View individual lead details
- Update lead status
- See lead scoring breakdown

## Tracking Integration

The tracking helper (`lib/tracking.ts`) fires custom events that you can listen to:

### Events:
1. **lead_submit** - Fired when a lead form is submitted
2. **phone_click** - Fired when someone clicks a phone number
3. **whatsapp_click** - Fired when someone clicks WhatsApp link

### Example: Google Tag Manager Integration

Add this to your `app/layout.tsx`:

```typescript
// In your GTM script
window.addEventListener('lead_submit', (e) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'lead_submit',
    lead_grade: e.detail.lead_grade,
    lead_score: e.detail.lead_score,
    budget_range: e.detail.monthly_budget_range
  });
});
```

## Project Structure

```
google-ads-system/
├── app/
│   ├── admin/              # Admin dashboard pages
│   │   ├── leads/[id]/     # Individual lead detail
│   │   └── page.tsx        # Admin dashboard
│   ├── api/                # API routes
│   │   ├── admin/          # Admin API endpoints
│   │   └── leads/          # Lead submission endpoint
│   ├── case-studies/       # Case studies page
│   ├── free-audit/         # Lead qualification form
│   ├── google-ads/         # Service pages
│   │   └── packages/       # Packages page
│   ├── thank-you/          # Thank you page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Site header
│   ├── Footer.tsx          # Site footer
│   └── CTASection.tsx      # CTA component
├── data/
│   └── case-studies.json   # Case studies data
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── database.types.ts   # TypeScript types
│   ├── lead-scoring.ts     # Lead scoring logic
│   └── tracking.ts         # Analytics tracking
├── middleware.ts           # Basic auth middleware
├── .env.example            # Environment template
└── README.md              # This file
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with hero and benefits |
| `/google-ads` | Detailed service page |
| `/google-ads/packages` | Three package tiers |
| `/case-studies` | 6 client success stories |
| `/free-audit` | Lead qualification form |
| `/thank-you` | Confirmation with package recommendation |
| `/admin` | Admin dashboard (protected) |
| `/admin/leads/[id]` | Individual lead details |

## Customization

### Update Case Studies
Edit `data/case-studies.json` with your own case studies.

### Update Packages
Edit `app/google-ads/packages/page.tsx` to modify package details.

### Change Lead Scoring Rules
Edit `lib/lead-scoring.ts` to adjust point values and thresholds.

### Modify Form Fields
Edit `app/free-audit/page.tsx` to add/remove form fields.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Import project in [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Deploy!

### Environment Variables for Production

Don't forget to set these in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Password:** Always change the admin password in production
2. **HTTPS Only:** Use HTTPS in production for Basic Auth security
3. **Row Level Security:** Consider enabling RLS in Supabase for added security
4. **Rate Limiting:** Add rate limiting to the lead submission endpoint
5. **Honeypot Fields:** Consider adding honeypot fields to prevent spam

## Testing

### Test Lead Scoring

Submit the form with different values to see scoring in action:

**High Score Test (Grade A):**
- Budget: $5,000+
- Decision maker: Yes
- Response within 5 min: Yes
- Include website URL
- Timeline: Immediate

**Low Score Test (Grade D):**
- Budget: $500-999
- Decision maker: No
- Response within 5 min: No
- No website URL
- Timeline: Just exploring

## Troubleshooting

### Supabase Connection Issues
- Verify your URL and anon key are correct
- Check if your Supabase project is active
- Ensure RLS policies allow inserts (or disable RLS for testing)

### Admin Login Not Working
- Check `.env` file has correct credentials
- Clear browser cache
- Try incognito/private browsing mode

### Form Submission Failing
- Check browser console for errors
- Verify Supabase connection
- Check network tab for API errors

## Next Steps (Post-MVP)

Consider adding these features:
- [ ] Email notifications (SendGrid, Postmark)
- [ ] SMS notifications (Twilio)
- [ ] Advanced analytics dashboard
- [ ] Lead nurturing sequences
- [ ] Booking/calendar integration (Calendly)
- [ ] Payment processing (Stripe)
- [ ] Client portal
- [ ] Automated reporting

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check Next.js documentation

## License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ using Next.js, TypeScript, and Supabase
