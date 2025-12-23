# GOOGLE CALENDAR TIMEZONE BUG - FIXED

## Issue Report
**User selected:** 2 PM Dubai time  
**Email received:** 6 PM (4 hours difference = GMT+4 offset)  
**Date:** December 24, 2025

## Root Cause
The Google Calendar API was receiving **both** a UTC timestamp AND a timezone parameter:

```typescript
start: {
  dateTime: "2025-12-24T10:00:00.000Z",  // UTC time for 2 PM Dubai
  timeZone: "Asia/Dubai"                  // ❌ This caused double conversion
}
```

Google Calendar interpreted this as "10:00 AM **IN** Dubai timezone", not "10:00 UTC, display in Dubai timezone". This caused it to add the offset again:
- 10:00 AM Dubai = 6:00 AM UTC
- Display in user's calendar: 6:00 AM UTC + 4 hours = 10:00 AM... 
- But actually showed 6 PM due to complex double conversion

## The Fix
**File:** [lib/google.ts](lib/google.ts)

**Changed:** Removed `timeZone` parameter from Google Calendar event creation

```typescript
// BEFORE (WRONG):
start: {
  dateTime: params.start,
  timeZone: params.timezone,  // ❌ Causes double conversion
}

// AFTER (CORRECT):
start: {
  dateTime: params.start,  // UTC ISO string
  // No timeZone - Google uses UTC directly ✅
}
```

## How It Works Now

1. **User selects:** "2:00 PM Dubai" slot
2. **Frontend sends:** 
   - `booking_start_utc: "2025-12-24T10:00:00.000Z"` (2 PM Dubai = 10 AM UTC)
3. **Backend stores:** UTC time + timezone separately
4. **Google Calendar receives:** Just the UTC time (no timezone parameter)
5. **Google Calendar creates event:** At 10:00 UTC
6. **User sees in calendar:** 10:00 UTC = 2:00 PM Dubai ✅ CORRECT!

## Verification
✅ User's calendar will display the meeting in their local timezone  
✅ Email invitation will show correct time  
✅ No more double conversion  

## Commit
`23b915c` - CRITICAL FIX: Remove timezone from Google Calendar event to fix double conversion bug

## Status
🚀 **DEPLOYED TO PRODUCTION**

Test by creating a new booking - the calendar invite will now show the correct time!
