# Rate Limiting Summary

## ✅ Changes Applied

### 1. Added Rate Limiting to `/api/leads/retrieve`
**File**: `app/api/leads/retrieve/route.ts`

**Changes**:
- Imported `rateLimit` from `@/lib/rate-limit`
- Created `retrieveRateLimit` with 5 req/min limit
- Applied rate limiter at start of GET handler (before token validation)

**Code**:
```typescript
import { rateLimit } from '@/lib/rate-limit';

const retrieveRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = retrieveRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  // ... rest of handler
}
```

### 2. Rate Limiting Coverage
All public API endpoints now have rate limiting:

| Endpoint | Rate Limit | Status |
|----------|-----------|--------|
| `/api/leads` (POST) | 5 req/min | ✅ Already enforced |
| `/api/leads/retrieve` (GET) | 5 req/min | ✅ **ADDED** |
| `/api/bookings` (POST) | 5 req/min | ✅ Already enforced |
| `/api/slots` (GET) | 5 req/min | ✅ Already enforced |

**Note**: Middleware at `middleware.ts` only protects `/admin` routes (not related to API rate limiting).

### 3. Implementation Pattern
All endpoints use inline rate limiting:
- Rate limiter created at module level
- Applied as first action in handler
- Returns 429 on violation with error message

**Behavior**:
- Per-IP tracking (uses `x-forwarded-for` header)
- In-memory store (Map)
- Automatic cleanup on window expiration
- Returns: `{ error: 'Too many requests. Please try again later.' }`

## 📋 Test Scripts Created

### 1. `test-rate-limit-quick.mjs`
**Purpose**: Quick production test of `/api/leads/retrieve`  
**Usage**: `node scripts/test-rate-limit-quick.mjs`  
**Behavior**: Makes 6 requests, expects 5 OK + 1 rate limited (429)

### 2. `test-rate-limit-local.mjs`
**Purpose**: Test against local dev server  
**Usage**:
1. Terminal 1: `npm run dev`
2. Terminal 2: `node scripts/test-rate-limit-local.mjs`

**Tests**:
- `/api/slots`
- `/api/leads/retrieve`
- Waits 60s between tests for rate limit reset

### 3. `test-rate-limits.mjs`
**Purpose**: Comprehensive test of all endpoints  
**Usage**: `node scripts/test-rate-limits.mjs`  
**Tests**: `/api/slots`, `/api/leads/retrieve`, `/api/leads` (with waits)

## ⚠️ Known Limitation
Production test failed because `/api/leads/retrieve` returned 404. This means:
- Either the route doesn't exist in production yet
- Or the deployment hasn't included the new code

**Solution**: Deploy changes to production:
```bash
git add -A
git commit -m "Add rate limiting to /api/leads/retrieve"
vercel --prod
```

Then re-run: `node scripts/test-rate-limit-quick.mjs`

## 🔐 Security Features
Rate limiting now protects against:
- ✅ Token brute-force attacks (retrieve endpoint)
- ✅ Form spam (leads/bookings)
- ✅ API abuse (slots)
- ✅ DDoS attempts

Combined with single-use tokens, the retrieval system is now:
- **Rate limited**: 5 attempts per minute per IP
- **Single-use**: Token consumed after first retrieval
- **Time-limited**: 15 minute expiration
- **Replay protected**: `used_at` check prevents reuse
