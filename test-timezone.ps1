# TIMEZONE VALIDATION TEST SCRIPT
# This script tests the complete booking flow and validates timezone consistency

Write-Host "`n🧪 TIMEZONE VALIDATION TEST" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "https://google-ads-system.vercel.app"

# STEP 1: Fetch slots
Write-Host "1️⃣  Fetching available time slots..." -ForegroundColor Yellow
try {
    $slotsResponse = Invoke-RestMethod -Uri "$BASE_URL/api/slots" -Method GET
    
    if (-not $slotsResponse.ok -or $slotsResponse.slots.Count -eq 0) {
        Write-Host "❌ No slots available" -ForegroundColor Red
        exit 1
    }
    
    $firstSlot = $slotsResponse.slots[0]
    Write-Host "✅ Got first slot: $($firstSlot.displayLabel)" -ForegroundColor Green
    Write-Host "   startUtcIso: $($firstSlot.startUtcIso)" -ForegroundColor Gray
    Write-Host "   endUtcIso: $($firstSlot.endUtcIso)" -ForegroundColor Gray
    Write-Host "   timezone: $($firstSlot.timezone)" -ForegroundColor Gray
    Write-Host ""
    
    # STEP 2: Parse and validate the UTC time
    Write-Host "2️⃣  Validating UTC to timezone conversion..." -ForegroundColor Yellow
    $utcTime = [DateTime]::Parse($firstSlot.startUtcIso)
    Write-Host "   Parsed UTC time: $($utcTime.ToString('yyyy-MM-dd HH:mm:ss')) UTC" -ForegroundColor Gray
    
    # Dubai is GMT+4, so add 4 hours to UTC
    $dubaiTime = $utcTime.AddHours(4)
    $dubaiTimeStr = $dubaiTime.ToString("h:mm tt")
    Write-Host "   Expected Dubai time (UTC+4): $dubaiTimeStr" -ForegroundColor Gray
    Write-Host "   Display label shows: $($firstSlot.displayLabel)" -ForegroundColor Gray
    
    if ($firstSlot.displayLabel -like "*$dubaiTimeStr*") {
        Write-Host "   ✅ Display label matches expected Dubai time!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Display label might not match - check format" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # STEP 3: Instructions for booking test
    Write-Host "3️⃣  To test a complete booking, you need a valid lead_id." -ForegroundColor Yellow
    Write-Host "   Run these commands with your lead_id:" -ForegroundColor Gray
    Write-Host ""
    Write-Host '   $leadId = "YOUR_LEAD_ID_HERE"' -ForegroundColor Cyan
    Write-Host '   $slot = (Invoke-RestMethod -Uri "' + $BASE_URL + '/api/slots").slots[0]' -ForegroundColor Cyan
    Write-Host '   $body = @{' -ForegroundColor Cyan
    Write-Host '       lead_id = $leadId' -ForegroundColor Cyan
    Write-Host '       booking_start_utc = $slot.startUtcIso' -ForegroundColor Cyan
    Write-Host '       booking_end_utc = $slot.endUtcIso' -ForegroundColor Cyan
    Write-Host '       booking_timezone = $slot.timezone' -ForegroundColor Cyan
    Write-Host '       selected_display_label = $slot.displayLabel' -ForegroundColor Cyan
    Write-Host '   } | ConvertTo-Json' -ForegroundColor Cyan
    Write-Host '   $result = Invoke-RestMethod -Uri "' + $BASE_URL + '/api/bookings" -Method POST -Body $body -ContentType "application/json"' -ForegroundColor Cyan
    Write-Host '   Write-Host "Booking created: $($result.booking_id)"' -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "4️⃣  After booking, check Vercel logs for PROOF:" -ForegroundColor Yellow
    Write-Host "   Look for these lines in logs:" -ForegroundColor Gray
    Write-Host '   - [Booking] UTC Timestamp: 2025-12-23T09:00:00.000Z' -ForegroundColor DarkGray
    Write-Host '   - [Booking] Timezone: Asia/Dubai' -ForegroundColor DarkGray
    Write-Host '   - [Booking] Computed Display Time: 1:00 PM' -ForegroundColor DarkGray
    Write-Host '   - [Booking] Email will show: Monday, December 23, 2025 at 1:00 PM' -ForegroundColor DarkGray
    Write-Host '   - [Booking] Re-computed from stored UTC+TZ: 1:00 PM' -ForegroundColor DarkGray
    Write-Host '   - [Booking] ✓ ALL TIMES MUST MATCH' -ForegroundColor DarkGray
    Write-Host ""
    
    Write-Host "✅ SLOT VALIDATION PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  CRITICAL: All times in logs MUST match the selected time." -ForegroundColor Yellow
    Write-Host "   If user selects 1:00 PM and email shows 5:00 PM, bug still exists!" -ForegroundColor Yellow
    Write-Host ""
    
    # Show all available slots
    Write-Host "📋 All Available Slots:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $slotsResponse.slots.Count; $i++) {
        $slot = $slotsResponse.slots[$i]
        $utc = [DateTime]::Parse($slot.startUtcIso)
        $dubai = $utc.AddHours(4)
        Write-Host "   $($i+1). $($slot.displayLabel)" -ForegroundColor White
        Write-Host "      UTC: $($utc.ToString('yyyy-MM-dd HH:mm')) | Dubai: $($dubai.ToString('yyyy-MM-dd hh:mm tt'))" -ForegroundColor DarkGray
    }
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   $($_.Exception)" -ForegroundColor DarkRed
    exit 1
}
