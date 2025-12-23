#!/usr/bin/env bash

# Local CI Test Script
# Simulates the GitHub Actions workflow locally to verify it works

set -e  # Exit on error

echo "======================================================================"
echo "🧪 LOCAL CI SIMULATION - RLS Security Check"
echo "======================================================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Initialize Supabase
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1: Initialize Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d ".git" ]; then
    echo "⚠️  Not in project root, initializing git..."
    git init
fi

supabase init --force
echo "✅ Supabase initialized"
echo ""

# Step 2: Start local Supabase
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 2: Start local Supabase instance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase start
echo "✅ Supabase started"
echo ""

# Step 3: Extract credentials
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 3: Extract local credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')

echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" > .env.production
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY" >> .env.production
echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env.production

echo "✅ Credentials configured:"
echo "   URL: $SUPABASE_URL"
echo "   Anon key: ${ANON_KEY:0:20}..."
echo "   Service key: ${SERVICE_KEY:0:20}..."
echo ""

# Step 4: Apply base schema
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 4: Apply base schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

supabase db reset --linked=false
echo "✅ Base schema applied"
echo ""

# Step 5: Apply migrations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Step 5: Apply migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Note: Migrations should be in supabase/migrations/ directory
# They will be auto-applied by supabase db reset

echo "✅ Migrations applied via db reset"
echo ""

# Step 6: Verify RLS policies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Step 6: Run RLS verification tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node scripts/verify-rls-fixed.mjs

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ RLS verification PASSED"
else
    echo ""
    echo "❌ RLS verification FAILED"
    FAILED=1
fi
echo ""

# Step 7: Check service role key exposure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Step 7: Check service role key exposure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "scripts/check-service-role-safety.mjs" ]; then
    node scripts/check-service-role-safety.mjs
    
    if [ $? -eq 0 ]; then
        echo "✅ Service role key safety check PASSED"
    else
        echo "❌ Service role key safety check FAILED"
        FAILED=1
    fi
else
    echo "⚠️  Script not found, skipping..."
fi
echo ""

# Step 8: Cleanup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Step 8: Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Stop Supabase? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase stop
    echo "✅ Supabase stopped"
else
    echo "⚠️  Supabase still running, stop manually with: supabase stop"
fi
echo ""

# Final result
echo "======================================================================"
if [ -z "$FAILED" ]; then
    echo "✅ ALL TESTS PASSED"
    echo "======================================================================"
    exit 0
else
    echo "❌ SOME TESTS FAILED"
    echo "======================================================================"
    exit 1
fi
