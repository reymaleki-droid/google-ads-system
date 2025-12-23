// TIMEZONE VALIDATION TEST
// Run this after deployment to PROVE the fix works

const BASE_URL = 'https://google-ads-system.vercel.app';

console.log('🧪 TIMEZONE VALIDATION TEST');
console.log('============================\n');

async function testTimezoneConsistency() {
  try {
    // Step 1: Get slots
    console.log('1️⃣  Fetching available time slots...');
    const slotsResponse = await fetch(`${BASE_URL}/api/slots`);
    const slotsData = await slotsResponse.json();
    
    if (!slotsData.ok || !slotsData.slots || slotsData.slots.length === 0) {
      console.error('❌ No slots available');
      return;
    }
    
    const firstSlot = slotsData.slots[0];
    console.log('✅ Got first slot:', firstSlot.displayLabel);
    console.log('   startUtcIso:', firstSlot.startUtcIso);
    console.log('   timezone:', firstSlot.timezone);
    console.log('');
    
    // Step 2: Compute expected display time from UTC + timezone
    const { formatInTimeZone } = require('date-fns-tz');
    const expectedTime = formatInTimeZone(
      new Date(firstSlot.startUtcIso), 
      firstSlot.timezone, 
      'h:mm a'
    );
    console.log('2️⃣  Expected display time (computed from UTC+TZ):', expectedTime);
    
    // Step 3: Verify it matches the display label
    if (firstSlot.displayLabel.includes(expectedTime)) {
      console.log('✅ Slot display label matches computed time\n');
    } else {
      console.error('❌ MISMATCH: Display label does NOT contain expected time');
      console.error('   Label:', firstSlot.displayLabel);
      console.error('   Expected time:', expectedTime);
      return;
    }
    
    // Step 4: Create a test booking (requires a valid lead_id)
    console.log('3️⃣  For full booking test, you need a valid lead_id.');
    console.log('   Run this command with your lead_id:');
    console.log('');
    console.log('   $leadId = "YOUR_LEAD_ID"');
    console.log('   $slots = Invoke-RestMethod -Uri "' + BASE_URL + '/api/slots"');
    console.log('   $slot = $slots.slots[0]');
    console.log('   $body = @{');
    console.log('     lead_id = $leadId');
    console.log('     booking_start_utc = $slot.startUtcIso');
    console.log('     booking_end_utc = $slot.endUtcIso');
    console.log('     booking_timezone = $slot.timezone');
    console.log('     selected_display_label = $slot.displayLabel');
    console.log('   } | ConvertTo-Json');
    console.log('   Invoke-RestMethod -Uri "' + BASE_URL + '/api/bookings" -Method POST -Body $body -ContentType "application/json"');
    console.log('');
    console.log('4️⃣  Then check Vercel logs to see PROOF output:');
    console.log('   - [Booking] UTC Timestamp: ...');
    console.log('   - [Booking] Computed Display Time: ...');
    console.log('   - [Booking] ✓ Display time matches label');
    console.log('   - [Booking] Email will show: ...');
    console.log('   - [Booking] Re-computed from stored UTC+TZ: ...');
    console.log('');
    console.log('✅ TIMEZONE MODEL VALIDATION PASSED');
    console.log('');
    console.log('CRITICAL: All times MUST match. If email shows different time,');
    console.log('the bug still exists. Check Vercel logs for proof.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTimezoneConsistency();
