# Test Booking Script - Verify Resend Email Logs

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESEND EMAIL VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Create a test lead
Write-Host "[1/3] Creating test lead..." -ForegroundColor Yellow
$leadBody = @{
    full_name = "Test User - Resend"
    email = "test-$(Get-Random)@resendtest.com"
    phone = "+971501234567"
    city = "Dubai"
    business_type = "E-commerce"
    monthly_ad_spend = "`$1,000 - `$5,000"
    heard_from = "API Test"
} | ConvertTo-Json

try {
    $leadResponse = Invoke-RestMethod -Uri "https://google-ads-system.vercel.app/api/leads" `
        -Method POST `
        -ContentType "application/json" `
        -Body $leadBody
    
    $leadId = $leadResponse.lead.id
    Write-Host "✓ Lead created: $leadId" -ForegroundColor Green
    Write-Host "  Email: $($leadResponse.lead.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create lead: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create booking for 2 hours from now
Write-Host "`n[2/3] Creating booking..." -ForegroundColor Yellow
$startTime = (Get-Date).AddHours(2).ToUniversalTime()
$endTime = $startTime.AddMinutes(30)

$bookingBody = @{
    lead_id = $leadId
    booking_start_utc = $startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    booking_end_utc = $endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    booking_timezone = "Asia/Dubai"
    selected_display_label = "Test - $($startTime.AddHours(4).ToString('h:mm tt')) Dubai"
} | ConvertTo-Json

Write-Host "  Start: $($startTime.ToString('yyyy-MM-dd HH:mm:ss')) UTC" -ForegroundColor Gray
Write-Host "  End:   $($endTime.ToString('yyyy-MM-dd HH:mm:ss')) UTC" -ForegroundColor Gray

try {
    $bookingResponse = Invoke-RestMethod -Uri "https://google-ads-system.vercel.app/api/bookings" `
        -Method POST `
        -ContentType "application/json" `
        -Body $bookingBody
    
    Write-Host "✓ Booking created: $($bookingResponse.booking_id)" -ForegroundColor Green
    Write-Host "  Status: $($bookingResponse.message)" -ForegroundColor Gray
    if ($bookingResponse.meet_url) {
        Write-Host "  Meet URL: $($bookingResponse.meet_url)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to create booking: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Step 3: Instructions
Write-Host "`n[3/3] Verification Steps:" -ForegroundColor Yellow
Write-Host "  1. Check the log monitoring terminal for:" -ForegroundColor White
Write-Host "     • RESEND_CONFIRMATION_START" -ForegroundColor Cyan
Write-Host "     • [Email] RESEND_API_CALL_START" -ForegroundColor Cyan
Write-Host "     • [Email] RESEND_API_CALL_SUCCESS" -ForegroundColor Cyan
Write-Host "     • RESEND_CONFIRMATION_SUCCESS" -ForegroundColor Cyan
Write-Host "`n  2. Check Vercel Dashboard Logs:" -ForegroundColor White
Write-Host "     https://vercel.com/parsas-projects-4da8a79d/google-ads-system/logs" -ForegroundColor Blue
Write-Host "`n  3. Check Resend Dashboard:" -ForegroundColor White
Write-Host "     https://resend.com/emails" -ForegroundColor Blue
Write-Host "     Look for email to: $($leadResponse.lead.email)" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
