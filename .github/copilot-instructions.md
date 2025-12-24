# Copilot Instructions (VS Code)

Before generating ANY response or code:

- Always read and apply [copilot_master_rules.md](../copilot_master_rules.md)
- Treat those rules as system-level constraints
- Do not proceed if required information is missing
- Avoid generic, shallow, or marketing-style output

Ignore these instructions ONLY if the user says: RESET MODE

---

## Project Context: Google Ads Lead Generation System

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (PostgreSQL), TailwindCSS, Zod validation

**Architecture:** Marketing website → Lead capture forms → Lead scoring → Admin dashboard. No payment processing.

---

## Critical Security Patterns

### Supabase Client Usage (NON-NEGOTIABLE)

**NEVER use anon key in API routes.** Always use service_role to bypass RLS:

```typescript
// ❌ WRONG - Subject to RLS policies
import { supabase } from '@/lib/supabase';

// ✅ CORRECT - API routes must use service_role
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS
);
```

**Client components:** Use `getSupabaseClient()` from [lib/supabase.ts](../lib/supabase.ts) (anon key)  
**API routes:** Always create new client with `SUPABASE_SERVICE_ROLE_KEY`

### Row Level Security (RLS)

**Current RLS policies** (see [supabase/FIX_RLS_NOW.sql](../supabase/FIX_RLS_NOW.sql)):
- Anonymous users: `INSERT` only on `leads` and `bookings` tables
- Anonymous users: `SELECT`, `UPDATE`, `DELETE` are BLOCKED (returns empty results)
- Service role: Full access to all tables

**When modifying RLS:** Test with both anon and service_role keys. See [supabase/migrations/001_initial_schema_with_rls.sql](../supabase/migrations/001_initial_schema_with_rls.sql).

---

## API Route Requirements

**Every API route MUST include:**

```typescript
export const dynamic = 'force-dynamic'; // Disable static optimization
export const runtime = 'nodejs'; // Required for Node.js APIs (bcrypt, crypto)
```

**Standard API route structure:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const apiRateLimit = rateLimit({ maxRequests: 10, windowMs: 60000 });

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Business logic...
}
```

See [app/api/leads/route.ts](../app/api/leads/route.ts) for reference.

---

## Lead Scoring System

**Automatic scoring on submission** ([lib/lead-scoring.ts](../lib/lead-scoring.ts)):
- Score: 0-100 based on budget, timeline, decision maker status
- Grade: A (75+), B (55-74), C (35-54), D (<35)
- Package recommendation: Scale (A), Growth (B), Starter (C/D)

**Never modify scoring logic without updating database validation.**

---

## Provider-Agnostic SMS Architecture

**SMS providers** ([lib/sms.ts](../lib/sms.ts), [lib/sms/providers/](../lib/sms/providers/)):
- Twilio, AWS SNS, Infobip, Mock (development)
- Single interface: `sendOtp({ phone, message })`
- Provider selection via `SMS_PROVIDER` env var
- Returns normalized `SendOTPResult` with `errorCode` field

**Adding new provider:**
1. Create `lib/sms/providers/new-provider.ts`
2. Export `send()` function matching interface
3. Add to provider map in [lib/sms.ts](../lib/sms.ts)

See [SMS-ARCHITECTURE.md](../SMS-ARCHITECTURE.md) for full architecture.

---

## Database Conventions

### Migration Files

**Location:** [supabase/migrations/](../supabase/migrations/)  
**Naming:** `00X_description.sql` (zero-padded sequential)  
**Production RLS:** Apply via [supabase/FIX_RLS_NOW.sql](../supabase/FIX_RLS_NOW.sql) or [supabase/PRODUCTION_RLS_HARDENING.sql](../supabase/PRODUCTION_RLS_HARDENING.sql)

**Test migrations locally:**
```bash
# Via Supabase CLI (if configured)
supabase migration up

# Or run SQL directly in Supabase Dashboard SQL Editor
```

### Database Types

**Auto-generated:** [lib/database.types.ts](../lib/database.types.ts)  
**Regenerate:** Use Supabase CLI `supabase gen types typescript`

---

## Attribution & Analytics

**Server-side attribution tracking** ([lib/attribution.ts](../lib/attribution.ts)):
- Captures UTM params, gclid, fbclid, wbraid, gbraid
- Privacy-safe: IP/user-agent are hashed (SHA-256)
- Linked to leads/bookings via session_id
- Stored in `attribution_events` table

**Event tracking:**
```typescript
import { extractAttributionData, saveAttributionEvent } from '@/lib/attribution';

const attributionData = extractAttributionData(request, {
  session_id: generateSessionId(),
  lead_id: 'lead_123'
});
await saveAttributionEvent(attributionData);
```

---

## Testing & Verification

### Commands

```bash
npm run dev              # Start development server
npm run check-setup      # Verify environment configuration
npm run verify:rls       # Test RLS policies (scripts/verify-rls.mjs)
npm run smoke:booking    # Test booking flow (scripts/smoke-booking.mjs)
```

### Manual Testing Checklist

1. **Lead submission:** Fill [/free-audit](http://localhost:3000/free-audit), verify in Supabase
2. **RLS verification:** Run [scripts/verify-rls.mjs](../scripts/verify-rls.mjs)
3. **Booking flow:** Test [/schedule](http://localhost:3000/schedule) with OTP verification
4. **Admin dashboard:** Test [/admin](http://localhost:3000/admin) (Google OAuth required)

### Verification Scripts

- [check-setup.js](../check-setup.js): Environment variable validation
- [scripts/verify-rls.mjs](../scripts/verify-rls.mjs): RLS policy testing
- [test-timezone-validation.js](../test-timezone-validation.js): Timezone handling

---

## UI/UX Design Standards (December 2025)

**Source-Driven Methodology:** Every design decision must cite industry-validated sources:
- **Stripe.com:** Hero structure, CTA patterns, final sections, value positioning
- **Linear.app:** Qualification approach, minimal iconography, equal visual weight
- **Vercel.com:** Typography system (Inter font, 8pt grid), solid backgrounds, max-width 1152px
- **NNGroup:** Homepage clarity (3-second test), F-pattern, 10-word max list items, Miller's Law (4-item max)
- **Baymard Institute:** Single primary CTA (-35% decision paralysis), verb-first language, 44px min touch targets
- **Material Design:** WCAG AA contrast, accessibility standards, breakpoint system (768px/1024px)

### Typography Scale (8pt Grid)
- **Display (H1):** text-6xl (60px) / line-height 1.1 / font-bold / tracking-tight
- **Title (H2):** text-4xl (36px) / line-height 1.2 / font-bold
- **Subtitle (H3):** text-2xl (24px) / line-height 1.3 / font-semibold
- **Body Large:** text-xl (20px) / line-height 1.5
- **Body:** text-base (16px) / line-height 1.6
- **Caption:** text-sm (14px) / line-height 1.5
- **Font:** Inter (Vercel standard, fallback system-ui)

### Color Palette (Neutral Professional)
- **Primary text:** gray-900 (#111827) - NOT blue
- **Secondary text:** gray-600 (#4B5563)
- **Backgrounds:** white, gray-50, gray-900 only (NO gradients)
- **Primary CTA:** gray-900 background (Apple/Stripe authority pattern, not blue)
- **Links:** gray-900 with underline (not blue)

### Component Hierarchy
- **Primary CTA:** gray-900 bg, white text, px-8 py-4 (44px min), font-semibold, ONE per section
- **Secondary CTA:** transparent bg, 1px gray-300 border, gray-900 text (optional, max 1)
- **Tertiary:** text links only, underline on hover, gray-600, 14px
- **NO:** Dual CTAs, "Most Popular" badges, decorative gradients, emojis, colored icon backgrounds

### Cognitive Load Principles
- **4 cards maximum** per section (Miller's Law: 7±2 items, optimal 4)
- **10-word maximum** per list item (NNGroup guideline)
- **3-second clarity test:** User understands service immediately
- **Concrete language:** "$2,000+ monthly" > "serious about ROI"
- **Spacing:** Section padding 96px desktop/64px mobile, element gaps 16/24/32/48px

### Current Implementation Status (December 25, 2025)
✅ **app/thank-you/ThankYouContent.tsx** - Fully redesigned:
- Removed emoji from headline ("Your meeting is confirmed")
- Status badge with reference ID for retrieval
- Gray-900 color scheme, white backgrounds, no gradients
- Single primary CTA, trust signal at bottom
- **Build fix:** Added missing closing `</div>` tag (line 265) - deployed to production

⚠️ **app/page.tsx** - Partially redesigned (10% complete):
- ✅ Hero section: Solid white bg, single CTA, "$2,000+ monthly", gray-900 text
- ❌ Qualification section: Still has blue checkmarks, dark slate background, long list items (needs: 4 items each, neutral colors, concrete language)
- ❌ Value section: Still has 6 cards with blue icons (needs: 4 cards, gray icons, concrete deliverables)
- ❌ Process section: Still has 5 numbered cards (needs: 4-step timeline with connector line, Stripe pattern)
- ❌ Packages section: Still has gradient background, "Most Popular" badge (needs: gray-50 bg, equal visual weight, concrete budget ranges)
- ❌ Case Studies section: Still generic (needs: "Representative outcomes" header, result footnote)
- ❌ Final CTA section: Still has gradient, question headline (needs: gray-900 bg, imperative headline, inverted button colors)
- ❌ Mobile CTA: Still blue-600 (needs: gray-900)

**Next implementation:** Complete remaining 8 homepage sections following source-driven design patterns documented above.

---

## Common Pitfalls

1. **Using anon key in API routes** → Leads to RLS blocks. Always use service_role.
2. **Missing `export const dynamic = 'force-dynamic'`** → Route gets statically rendered, breaks dynamic logic.
3. **Forgetting `export const runtime = 'nodejs'`** → Edge runtime errors for Node.js APIs (bcrypt, crypto).
4. **Not testing RLS policies** → Data leaks in production. Always test with anon key.
5. **Hardcoding provider logic** → Breaks SMS abstraction. Use [lib/sms.ts](../lib/sms.ts) interface.
6. **Skipping rate limiting** → API abuse. Always add `rateLimit()` to public endpoints.
7. **Adding emojis or decorative elements** → Violates source-driven UI standards. Use concrete, professional language.
8. **Using blue for primary CTAs** → Should be gray-900 (Apple/Stripe authority pattern).
9. **Creating gradients** → Use solid backgrounds only (white, gray-50, gray-900).
10. **Missing closing tags in JSX** → Always count opening/closing divs. Recent build error (Thank You page) was caused by missing `</div>` at line 265.

---

## Documentation Map

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Setup, environment variables, testing |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System flows, data flows, component diagrams |
| [PROJECT-SUMMARY.md](../PROJECT-SUMMARY.md) | Feature list, tech stack, deliverables |
| [SMS-ARCHITECTURE.md](../SMS-ARCHITECTURE.md) | SMS provider architecture, adding providers |
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Pre-deployment checklist |
| [QUICK-REFERENCE.md](../QUICK-REFERENCE.md) | Commands, URLs, file locations |

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| [lib/supabase.ts](../lib/supabase.ts) | Supabase client creation (anon vs service_role) |
| [lib/lead-scoring.ts](../lib/lead-scoring.ts) | Lead scoring algorithm |
| [lib/sms.ts](../lib/sms.ts) | SMS provider interface |
| [lib/rate-limit.ts](../lib/rate-limit.ts) | Rate limiting middleware |
| [lib/security.ts](../lib/security.ts) | Abuse detection, suspicious event logging |
| [lib/attribution.ts](../lib/attribution.ts) | Attribution tracking (UTM, click IDs) |
| [middleware.ts](../middleware.ts) | Next.js middleware (currently bypassed) |
| [app/api/leads/route.ts](../app/api/leads/route.ts) | Reference API route implementation |
| [app/thank-you/ThankYouContent.tsx](../app/thank-you/ThankYouContent.tsx) | **Redesigned** confirmation page (source-driven UI, deployed Dec 25, 2025) |
| [app/page.tsx](../app/page.tsx) | **Partially redesigned** homepage (hero only, 8 sections pending) |

## Recent Changes & Deployment Status

**December 25, 2025 - UI/UX Redesign Phase:**
- **Commit f5881e2:** Fixed missing closing `</div>` in Thank You page (line 265, Next Steps section)
- **Commit 0e5a104:** Redesigned Thank You page + partial Homepage hero
- **Deployed:** https://google-ads-system.vercel.app (production)
- **Build Status:** ✅ Passing (fixed syntax error)
- **Known Issues:** 
  - Homepage 90% incomplete (only hero section updated)
  - Temp files in git history (.env.vercel.production, env-value.txt, set-env-true.txt)

**Active Work:**
- Complete remaining 8 homepage sections following source-driven design patterns
- Remove temp files from git history (low priority)
