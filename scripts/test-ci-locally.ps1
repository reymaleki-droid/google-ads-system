# Local CI Test Script (PowerShell)
# Simulates the GitHub Actions workflow locally on Windows

$ErrorActionPreference = "Stop"

Write-Host "`n======================================================================"
Write-Host "🧪 LOCAL CI SIMULATION - RLS Security Check" -ForegroundColor Cyan
Write-Host "======================================================================`n"

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not installed" -ForegroundColor Red
    Write-Host "Install with: npm install -g supabase"
    exit 1
}

# Step 1: Initialize Supabase
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "📦 Step 1: Initialize Supabase" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

if (!(Test-Path ".git")) {
    Write-Host "⚠️  Not in project root, initializing git..." -ForegroundColor Yellow
    git init
}

supabase init --force
Write-Host "✅ Supabase initialized`n" -ForegroundColor Green

# Step 2: Start local Supabase
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🚀 Step 2: Start local Supabase instance" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

supabase start
Write-Host "✅ Supabase started`n" -ForegroundColor Green

# Step 3: Extract credentials
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "📋 Step 3: Extract local credentials" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

$status = supabase status | Out-String
$SUPABASE_URL = ($status | Select-String "API URL:\s+(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$ANON_KEY = ($status | Select-String "anon key:\s+(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$SERVICE_KEY = ($status | Select-String "service_role key:\s+(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

@"
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
"@ | Out-File -FilePath .env.production -Encoding utf8

Write-Host "✅ Credentials configured:" -ForegroundColor Green
Write-Host "   URL: $SUPABASE_URL"
Write-Host "   Anon key: $($ANON_KEY.Substring(0, 20))..."
Write-Host "   Service key: $($SERVICE_KEY.Substring(0, 20))...`n"

# Step 4: Apply base schema
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "📦 Step 4: Apply base schema" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

supabase db reset --linked=$false
Write-Host "✅ Base schema applied`n" -ForegroundColor Green

# Step 5: Verify RLS policies
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🔍 Step 5: Run RLS verification tests" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

$rlsResult = node scripts/verify-rls-fixed.mjs
Write-Host $rlsResult

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ RLS verification PASSED`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ RLS verification FAILED`n" -ForegroundColor Red
    $failed = $true
}

# Step 6: Check service role key exposure
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🔍 Step 6: Check service role key exposure" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

if (Test-Path "scripts/check-service-role-safety.mjs") {
    $safetyResult = node scripts/check-service-role-safety.mjs
    Write-Host $safetyResult
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Service role key safety check PASSED`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Service role key safety check FAILED`n" -ForegroundColor Red
        $failed = $true
    }
} else {
    Write-Host "⚠️  Script not found, skipping...`n" -ForegroundColor Yellow
}

# Step 7: Cleanup
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🧹 Step 7: Cleanup" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"

$response = Read-Host "Stop Supabase? (y/n)"
if ($response -eq "y") {
    supabase stop
    Write-Host "✅ Supabase stopped`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Supabase still running, stop manually with: supabase stop`n" -ForegroundColor Yellow
}

# Final result
Write-Host "======================================================================"
if (!$failed) {
    Write-Host "✅ ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "======================================================================`n"
    exit 0
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "======================================================================`n"
    exit 1
}
