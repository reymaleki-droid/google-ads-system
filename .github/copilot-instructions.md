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

## Common Pitfalls

1. **Using anon key in API routes** → Leads to RLS blocks. Always use service_role.
2. **Missing `export const dynamic = 'force-dynamic'`** → Route gets statically rendered, breaks dynamic logic.
3. **Forgetting `export const runtime = 'nodejs'`** → Edge runtime errors for Node.js APIs (bcrypt, crypto).
4. **Not testing RLS policies** → Data leaks in production. Always test with anon key.
5. **Hardcoding provider logic** → Breaks SMS abstraction. Use [lib/sms.ts](../lib/sms.ts) interface.
6. **Skipping rate limiting** → API abuse. Always add `rateLimit()` to public endpoints.

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
