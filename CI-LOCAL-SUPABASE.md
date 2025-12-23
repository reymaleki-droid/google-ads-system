# CI Security Check - Local Supabase Testing

## Overview
The CI workflow now runs against a **local ephemeral Supabase instance** instead of production. This ensures:
- ✅ No production data exposure
- ✅ No production database credentials in GitHub
- ✅ Isolated testing environment
- ✅ Fast, reproducible tests

## Changes Made

### 1. Updated CI Workflow
**File**: `.github/workflows/security-check.yml`

**Key Changes**:
- Added Supabase CLI setup step
- Starts local Supabase instance (`supabase start`)
- Extracts local credentials automatically
- Applies migrations from `supabase/migrations/`
- Runs verification against local instance
- Stops Supabase on completion (cleanup)

**No Secrets Required**: Only uses GitHub's default token.

### 2. Created Consolidated Schema
**File**: `supabase/migrations/001_initial_schema_with_rls.sql`

**Contents**:
- All table definitions (leads, bookings, google_tokens, retrieval_tokens)
- All indexes
- All RLS policies (blocking anon SELECT/UPDATE/DELETE)
- All grants (PostgREST requirements)

**Security Model**:
- Anon: INSERT only (with validation checks)
- Anon SELECT: **BLOCKED** with `USING (false)`
- Anon UPDATE/DELETE: **BLOCKED**
- Service role: Full access bypass

### 3. Local Test Scripts
**Bash**: `scripts/test-ci-locally.sh`  
**PowerShell**: `scripts/test-ci-locally.ps1`

**What they do**:
1. Initialize Supabase (`supabase init`)
2. Start local instance (`supabase start`)
3. Extract credentials (URL, anon key, service key)
4. Apply migrations (`supabase db reset`)
5. Run `verify-rls-fixed.mjs`
6. Run `check-service-role-safety.mjs`
7. Stop Supabase (cleanup)

## CI Workflow Steps

```yaml
1. Setup Node.js (v20)
2. Install dependencies (npm ci)
3. Setup Supabase CLI
4. Start local Supabase
   - Runs Postgres + PostgREST in Docker
   - Generates local anon/service keys
5. Extract credentials
   - Parses `supabase status` output
   - Writes to .env.production
6. Apply schema
   - Runs `supabase db reset`
   - Auto-applies migrations from supabase/migrations/
7. Run RLS verification
   - Tests anon INSERT (should work)
   - Tests anon SELECT (should fail - blocked)
   - Tests anon UPDATE/DELETE (should fail - blocked)
   - Tests google_tokens access (should fail - blocked)
8. Check service role safety
   - Scans code for hardcoded keys
   - Verifies environment variable usage
9. Cleanup
   - Stops Supabase containers
```

## Security Tests

### What Gets Verified

| Test | Expected Result | Failure Condition |
|------|----------------|-------------------|
| Anon INSERT leads | ✅ Success (with consent=true) | INSERT blocked |
| Anon SELECT leads | ❌ Blocked (401) | SELECT works |
| Anon UPDATE leads | ❌ Blocked | UPDATE works |
| Anon DELETE leads | ❌ Blocked | DELETE works |
| Anon INSERT bookings | ✅ Success | INSERT blocked |
| Anon SELECT bookings | ❌ Blocked | SELECT works |
| Anon access google_tokens | ❌ Blocked | Access granted |
| Service role full access | ✅ Success | Access denied |
| Service key in bundle | ❌ None found | Key detected |

### Failure Scenarios

**Workflow fails if**:
- Anon can SELECT from leads/bookings (data leak)
- Anon can UPDATE/DELETE (data tampering)
- Anon can access google_tokens (credential leak)
- Service role key found in client code

## Local Testing

### Prerequisites
```bash
npm install -g supabase
```

### Run Locally (Bash)
```bash
chmod +x scripts/test-ci-locally.sh
./scripts/test-ci-locally.sh
```

### Run Locally (PowerShell)
```powershell
.\scripts\test-ci-locally.ps1
```

### Expected Output
```
🧪 LOCAL CI SIMULATION - RLS Security Check
======================================================================

✅ Supabase CLI found

📦 Step 1: Initialize Supabase
✅ Supabase initialized

🚀 Step 2: Start local Supabase instance
✅ Supabase started

📋 Step 3: Extract local credentials
✅ Credentials configured:
   URL: http://localhost:54321
   Anon key: eyJhbGc...
   Service key: eyJhbGc...

📦 Step 4: Apply base schema
✅ Base schema applied

🔍 Step 5: Run RLS verification tests

🔒 RLS VERIFICATION

✅ PASS: anon INSERT lead
✅ PASS: anon SELECT blocked (leads)
✅ PASS: anon UPDATE blocked (leads)
✅ PASS: anon DELETE blocked (leads)
✅ PASS: anon INSERT booking
✅ PASS: anon SELECT blocked (bookings)
✅ PASS: anon access google_tokens blocked
✅ PASS: service_role full access

✅ ALL 10 TESTS PASSED

✅ RLS verification PASSED

🔍 Step 6: Check service role key exposure
✅ Service role key safety check PASSED

🧹 Step 7: Cleanup
✅ Supabase stopped

======================================================================
✅ ALL TESTS PASSED
======================================================================
```

## Migration Files

All migrations in `supabase/migrations/` are auto-applied by `supabase db reset`:

1. `001_initial_schema_with_rls.sql` - Base schema + RLS policies
2. `002_add_booking_timezone.sql` - Add timezone column
3. `003_create_retrieval_tokens.sql` - Single-use tokens table
4. `add_missing_columns.sql` - Additional columns
5. `google_tokens.sql` - OAuth tokens table

**Order**: Alphabetical (001, 002, 003, add, google)

## Benefits

### Security
- ✅ No production DB credentials in CI
- ✅ No risk of touching production data
- ✅ Isolated test environment per run
- ✅ Ephemeral (auto-destroyed after tests)

### Speed
- ✅ Fast startup (~30 seconds)
- ✅ No network latency
- ✅ Local Docker containers
- ✅ Parallel test runs possible

### Reliability
- ✅ Consistent environment
- ✅ No external dependencies
- ✅ Reproducible failures
- ✅ Can run offline (after Docker images cached)

### Developer Experience
- ✅ Test locally before pushing
- ✅ Same environment as CI
- ✅ Easy debugging
- ✅ No secrets management needed

## Troubleshooting

### Supabase CLI not found
```bash
npm install -g supabase
```

### Docker not running
```bash
# Start Docker Desktop (Windows/Mac)
# Or start Docker daemon (Linux):
sudo systemctl start docker
```

### Port conflicts
```bash
# Stop existing Supabase instance:
supabase stop

# Or use different ports:
supabase start --db-port 5433 --api-port 54322
```

### Migration errors
```bash
# Check migration files syntax:
supabase db lint

# Reset and reapply:
supabase db reset --linked=false
```

## Next Steps

### Optional Enhancements
1. Add performance tests (query timing)
2. Add data validation tests
3. Test migration rollbacks
4. Add load testing (concurrent requests)
5. Test backup/restore procedures

### Monitoring
- GitHub Actions logs show full output
- Failed runs send notifications
- Can download artifacts (logs, screenshots)

## References

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
