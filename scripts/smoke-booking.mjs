#!/usr/bin/env node

const API_BASE = process.env.API_BASE || 'https://google-ads-system.vercel.app';

let failures = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
    } else {
      console.log(`❌ FAIL: ${name}`);
      failures++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    failures++;
  }
}

async function main() {
  console.log('\n🧪 BOOKING SMOKE TEST\n');

  let leadId, slotStart, slotEnd;

  // Test 1: Create lead
  await test('POST /api/leads', async () => {
    const response = await fetch(`${API_BASE}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Smoke Test User',
        email: `smoke-${Date.now()}@test.local`,
        phone_e164: '+971501234567',
        goal_primary: 'Increase leads',
        monthly_budget_range: '5000-9999',
        timeline: 'ASAP',
        response_within_5_min: true,
        decision_maker: true,
        consent: true,
        honeypot: '',
        _submit_timestamp: Date.now()
      })
    });

    const data = await response.json();
    if (response.ok && data.ok && data.lead_id) {
      leadId = data.lead_id;
      return true;
    }
    console.log('Lead response:', data);
    return false;
  });

  // Test 2: Get available slots
  await test('GET /api/slots', async () => {
    const response = await fetch(`${API_BASE}/api/slots`);
    const data = await response.json();
    
    if (response.ok && data.ok && data.slots?.length > 0) {
      slotStart = data.slots[0].startUtcIso;
      slotEnd = data.slots[0].endUtcIso;
      return true;
    }
    console.log('Slots response:', data);
    return false;
  });

  // Test 3: Create booking
  await test('POST /api/bookings', async () => {
    const response = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: leadId,
        booking_start_utc: slotStart,
        booking_end_utc: slotEnd,
        booking_timezone: 'Asia/Dubai',
        selected_display_label: 'Test Slot'
      })
    });

    const data = await response.json();
    if (response.status === 201 && data.ok && data.booking_id) {
      global.bookingId = data.booking_id;
      return true;
    }
    console.log('Booking response:', response.status, data);
    return false;
  });

  // Test 4: Double-booking should fail with 409
  await test('POST /api/bookings (duplicate - should return 409)', async () => {
    const response = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: leadId,
        booking_start_utc: slotStart,
        booking_end_utc: slotEnd,
        booking_timezone: 'Asia/Dubai',
        selected_display_label: 'Test Slot'
      })
    });

    const data = await response.json();
    // Should return 409 Conflict
    if (response.status === 409 && !data.ok) {
      return true;
    }
    console.log('Duplicate booking response:', response.status, data);
    return false;
  });

  // Test 5: ICS file download
  await test('GET /api/ics?booking_id=...', async () => {
    const response = await fetch(`${API_BASE}/api/ics?booking_id=${global.bookingId}`);
    
    if (response.ok && response.headers.get('content-type')?.includes('text/calendar')) {
      const icsContent = await response.text();
      // Verify ICS structure
      return icsContent.includes('BEGIN:VCALENDAR') && 
             icsContent.includes('BEGIN:VEVENT') && 
             icsContent.includes('END:VEVENT') &&
             icsContent.includes('END:VCALENDAR');
    }
    return false;
  });

  console.log(`\n${failures === 0 ? '✅' : '❌'} ${failures === 0 ? 'ALL SMOKE TESTS PASSED' : `${failures} TESTS FAILED`}\n`);
  process.exit(failures);
}

main();
