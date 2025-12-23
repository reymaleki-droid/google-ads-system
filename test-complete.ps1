# COMPLETE TIMEZONE TEST AND FIX VERIFICATION
# Run this after deployment completes

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TIMEZONE VALIDATION - COMPLETE TEST   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$BASE_URL = "https://google-ads-system.vercel.app"

Write-Host "🔍 Step 1: Fetching slots from API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/slots" -ErrorAction Stop
    
    if (-not $response.ok) {
        throw "API returned ok=false"
    }
    
    Write-Host "✅ API call successful" -ForegroundColor Green
    Write-Host "   Timezone: $($response.timezone)" -ForegroundColor Gray
    Write-Host "   Slots available: $($response.slots.Count)`n" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to fetch slots: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Step 2: Validating timezone conversion..." -ForegroundColor Yellow
Write-Host ""

$allCorrect = $true
$testCount = [Math]::Min(3, $response.slots.Count)

for ($i = 0; $i -lt $testCount; $i++) {
    $slot = $response.slots[$i]
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "Test Slot #$($i + 1)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Parse UTC time
    $utc = [DateTime]::ParseExact($slot.startUtcIso, "yyyy-MM-ddTHH:mm:ss.fffZ", $null, [System.Globalization.DateTimeStyles]::AssumeUniversal)
    
    # Calculate Dubai time (UTC + 4 hours)
    $dubaiHour = ($utc.Hour + 4) % 24
    $dubaiMinute = $utc.Minute
    
    # Convert to 12-hour format
    if ($dubaiHour -eq 0) {
        $hour12 = 12
        $ampm = "AM"
    } elseif ($dubaiHour -lt 12) {
        $hour12 = $dubaiHour
        $ampm = "AM"
    } elseif ($dubaiHour -eq 12) {
        $hour12 = 12
        $ampm = "PM"
    } else {
        $hour12 = $dubaiHour - 12
        $ampm = "PM"
    }
    
    $expectedTime = "$hour12`:$('{0:D2}' -f $dubaiMinute) $ampm"
    
    Write-Host "📥 INPUT (from API):" -ForegroundColor White
    Write-Host "   startUtcIso: $($slot.startUtcIso)" -ForegroundColor Gray
    Write-Host "   displayLabel: $($slot.displayLabel)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "🧮 CALCULATION:" -ForegroundColor White
    Write-Host "   UTC Time: $('{0:D2}' -f $utc.Hour):$('{0:D2}' -f $utc.Minute)" -ForegroundColor Gray
    Write-Host "   + 4 hours (Dubai offset)" -ForegroundColor Gray
    Write-Host "   = Dubai Time: $('{0:D2}' -f $dubaiHour):$('{0:D2}' -f $dubaiMinute) (24-hour)" -ForegroundColor Gray
    Write-Host "   = Display: $expectedTime (12-hour)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "✔️  VERIFICATION:" -ForegroundColor White
    Write-Host "   Expected: '$expectedTime'" -ForegroundColor Yellow
    Write-Host "   Actual:   '$($slot.displayLabel)'" -ForegroundColor Yellow
    
    if ($slot.displayLabel -like "*$expectedTime*") {
        Write-Host "   ✅ MATCH! This slot is CORRECT" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MISMATCH! This slot is WRONG" -ForegroundColor Red
        $allCorrect = $false
    }
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if ($allCorrect) {
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║         ✅ ALL TESTS PASSED! ✅         ║" -ForegroundColor Green
    Write-Host "║   Timezone conversion is now CORRECT!    ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Users will now receive correct times in emails!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║           ❌ TESTS FAILED ❌            ║" -ForegroundColor Red
    Write-Host "║   Timezone conversion is still BROKEN!   ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  The bug still exists! Further debugging needed." -ForegroundColor Red
    Write-Host ""
}

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run database migration if not done:" -ForegroundColor White
Write-Host "   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_timezone TEXT DEFAULT 'Asia/Dubai';" -ForegroundColor Gray
Write-Host "   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS local_start_display TEXT;" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create a test booking with your lead_id" -ForegroundColor White
Write-Host "3. Check Vercel function logs for booking validation output" -ForegroundColor White
Write-Host "4. Verify email shows the correct time" -ForegroundColor White
Write-Host ""
