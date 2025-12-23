# SMS Architecture - Visual Guide

## Before Refactoring (Tightly Coupled)

```
app/api/otp/send/route.ts
        |
        |-- imports sendSMS()
        |-- knows about Twilio
        |-- knows about AWS SNS
        |
        v
    lib/sms.ts
        |
        |-- Twilio code mixed in
        |-- AWS code mixed in
        |-- Hard to test
        |-- Hard to add providers
```

❌ **Problems:**
- Provider logic mixed with utilities
- Hard to switch providers
- Difficult to test in isolation
- API route aware of providers

---

## After Refactoring (Provider-Agnostic)

```
app/api/otp/send/route.ts
        |
        |-- imports sendOtp() only
        |-- NO provider knowledge
        |
        v
    lib/sms.ts (Stable Interface)
        |
        |-- sendOtp({ phone, message })
        |-- generateOTP()
        |-- hashOTP()
        |-- buildOTPMessage()
        |
        |-- Provider Selection Logic
        |
        +----------------------------+
        |                            |
        v                            v
lib/sms/providers/           lib/sms/providers/
  twilio.ts                    infobip.ts
    |                              |
    |-- sendSMS()                  |-- sendSMS()
    |-- Error mapping              |-- Error mapping
    |-- Returns normalized         |-- Returns normalized
        response                       response
```

✅ **Benefits:**
- Clean separation of concerns
- Easy to test each provider
- Simple to add new providers
- API route knows nothing about providers

---

## Data Flow

### 1. API Request
```
POST /api/otp/send
{
  "leadId": "...",
  "phoneNumber": "+14155552671"
}
```

### 2. API Route Processing
```typescript
// app/api/otp/send/route.ts

import { sendOtp, buildOTPMessage } from '@/lib/sms';

const otp = generateOTP();  // "123456"
const message = buildOTPMessage(otp);  // "Your code is: 123456..."

const result = await sendOtp({ 
  phone: phoneNumber, 
  message 
});

if (result.success) {
  console.log(`Provider: ${result.provider}`);  // "twilio_sms"
  console.log(`Message ID: ${result.messageId}`);  // "SM..."
}
```

### 3. SMS Module (Provider Selection)
```typescript
// lib/sms.ts

export async function sendOtp({ phone, message }) {
  const provider = process.env.SMS_PROVIDER;  // "twilio_sms"
  
  switch (provider) {
    case 'twilio_sms':
      return await sendViaTwilio(phone, message);
    case 'infobip':
      return await sendViaInfobip(phone, message);
    // ... other providers
  }
}
```

### 4. Provider Implementation
```typescript
// lib/sms/providers/twilio.ts

export async function sendSMS(config, phoneNumber, message) {
  // Make Twilio API call
  const response = await fetch(twilioUrl, { ... });
  
  // Map Twilio errors to normalized codes
  if (twilioError === 21211) {
    return { 
      success: false, 
      errorCode: 'invalid_phone'  // Normalized!
    };
  }
  
  return { 
    success: true, 
    messageId: twilioResponse.sid 
  };
}
```

### 5. Normalized Response
```typescript
{
  success: true,
  provider: "twilio_sms",      // Which provider was used
  messageId: "SM1234...",      // Provider's message ID
  error?: undefined,           // No error
  errorCode?: undefined        // No error code
}
```

---

## Error Flow

### Provider-Specific Error → Normalized Error Code

```
Twilio Error 21211 (Invalid Phone)
        |
        v
lib/sms/providers/twilio.ts
        |
        |-- Maps to: errorCode: 'invalid_phone'
        |
        v
    lib/sms.ts
        |
        |-- Returns: { success: false, errorCode: 'invalid_phone', provider: 'twilio_sms' }
        |
        v
app/api/otp/send/route.ts
        |
        |-- if (errorCode === 'invalid_phone') {
        |     return "Invalid phone number format"
        |   }
        |
        v
    Client Response
        {
          "error": "Invalid phone number format. Please check and try again."
        }
```

**Same flow for ALL providers!**

---

## Provider Comparison

### Structure

```
lib/sms/providers/
├── twilio.ts          ← Twilio-specific implementation
├── aws-sns.ts         ← AWS-specific implementation
├── infobip.ts         ← Infobip-specific implementation
└── development.ts     ← Dev mode (console logging)
```

### Common Interface (All Providers)

```typescript
// Every provider exports the same interface:

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;  // Normalized: 'invalid_phone' | 'throttled' | ...
}

export async function sendSMS(
  config: ProviderConfig,
  phoneNumber: string,
  message: string
): Promise<SendResult>
```

### Error Code Mapping (Each Provider)

```typescript
// Twilio
if (twilioCode === 21211) → 'invalid_phone'
if (twilioCode === 20429) → 'throttled'

// Infobip  
if (infobipStatus === 429) → 'throttled'
if (infobipError === 'BAD_REQUEST') → 'invalid_phone'

// AWS SNS
if (awsError === 'ThrottlingException') → 'throttled'
if (awsError === 'InvalidParameterException') → 'invalid_phone'
```

---

## Testing Strategy

### Unit Tests (Provider Isolation)

```typescript
// Test Twilio provider in isolation
import * as TwilioProvider from '@/lib/sms/providers/twilio';

const result = await TwilioProvider.sendSMS(
  { accountSid: 'test', authToken: 'test', phoneNumber: '+1...' },
  '+14155552671',
  'Test message'
);

expect(result.errorCode).toBe('invalid_phone');  // Normalized!
```

### Integration Tests (Full Flow)

```typescript
// Test via main interface
import { sendOtp } from '@/lib/sms';

process.env.SMS_PROVIDER = 'development';  // Use dev mode for testing

const result = await sendOtp({
  phone: '+14155552671',
  message: 'Your code is: 123456'
});

expect(result.provider).toBe('development');
expect(result.success).toBe(true);
```

---

## Adding a New Provider (Example: Vonage)

### Step 1: Create Provider File

```typescript
// lib/sms/providers/vonage.ts

export interface VonageConfig {
  apiKey: string;
  apiSecret: string;
  from: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(
  config: VonageConfig,
  phoneNumber: string,
  message: string
): Promise<SendResult> {
  try {
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      body: JSON.stringify({
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        from: config.from,
        to: phoneNumber,
        text: message,
      }),
    });

    const data = await response.json();

    // Map Vonage errors to normalized codes
    if (data.messages[0].status !== '0') {
      let errorCode = 'provider_error';
      
      if (data.messages[0].status === '1') errorCode = 'throttled';
      if (data.messages[0].status === '3') errorCode = 'invalid_phone';
      
      return {
        success: false,
        error: data.messages[0]['error-text'],
        errorCode,
      };
    }

    return {
      success: true,
      messageId: data.messages[0]['message-id'],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorCode: 'network_error',
    };
  }
}
```

### Step 2: Import in `lib/sms.ts`

```typescript
import * as VonageProvider from './sms/providers/vonage';
```

### Step 3: Add Switch Case

```typescript
export async function sendOtp({ phone, message }) {
  const provider = process.env.SMS_PROVIDER;
  
  switch (provider) {
    case 'twilio_sms':
      return await sendViaTwilio(phone, message);
    
    case 'vonage':  // NEW!
      return await sendViaVonage(phone, message);
    
    // ... other cases
  }
}
```

### Step 4: Implement Helper Function

```typescript
async function sendViaVonage(
  phoneNumber: string,
  message: string
): Promise<SendOTPResult> {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  const from = process.env.VONAGE_FROM;

  if (!apiKey || !apiSecret || !from) {
    return {
      success: false,
      provider: 'vonage',
      error: 'Vonage not configured',
      errorCode: 'not_configured',
    };
  }

  const result = await VonageProvider.sendSMS(
    { apiKey, apiSecret, from },
    phoneNumber,
    message
  );

  return {
    ...result,
    provider: 'vonage',
  };
}
```

### Step 5: Configure Environment

```bash
SMS_PROVIDER=vonage
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
VONAGE_FROM=YourBrand
```

### Step 6: Test

```bash
# Set env vars
export SMS_PROVIDER=vonage
export VONAGE_API_KEY=...

# Run tests
node scripts/verify-otp.mjs

# Test in production
# Deploy and monitor logs
```

**That's it!** New provider added in ~50 lines of code.

---

## Monitoring & Observability

### Log Structure (Normalized Across Providers)

```json
{
  "event": "OTP_SENT",
  "provider": "twilio_sms",
  "messageId": "SM1234567890",
  "phoneDisplay": "***2671",
  "duration_ms": 1234,
  "success": true
}
```

### Metrics to Track (Per Provider)

```typescript
// Success rate by provider
SELECT 
  provider,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM otp_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

### Error Distribution (Normalized Codes)

```typescript
// Error codes across all providers
SELECT 
  error_code,
  provider,
  COUNT(*) as occurrences
FROM otp_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_code, provider
ORDER BY occurrences DESC;

// Result:
// error_code     | provider     | occurrences
// ---------------|--------------|-----------
// invalid_phone  | twilio_sms   | 45
// throttled      | infobip      | 12
// provider_down  | twilio_sms   | 3
```

---

## Production Checklist

### Before Switching Providers

- [ ] Test new provider in development mode
- [ ] Verify error mapping works correctly
- [ ] Check cost per SMS
- [ ] Confirm global coverage (if needed)
- [ ] Set up monitoring/alerts
- [ ] Update documentation

### Deployment

```bash
# 1. Update environment variable
vercel env add SMS_PROVIDER production
# Value: infobip (or your chosen provider)

# 2. Add provider credentials
vercel env add INFOBIP_API_KEY production
vercel env add INFOBIP_SENDER production

# 3. Deploy
vercel --prod

# 4. Monitor logs
vercel logs --follow | grep OTP_SENT
```

### Rollback

```bash
# Change provider back
vercel env rm SMS_PROVIDER production
vercel env add SMS_PROVIDER production
# Value: twilio_sms

# Redeploy
vercel --prod
```

---

## Summary

✅ **Clean Architecture**  
✅ **Easy to Test**  
✅ **Simple to Switch**  
✅ **Normalized Errors**  
✅ **Observable & Debuggable**

**Total Code:** ~400 lines  
**Providers:** 4 (Twilio, AWS SNS, Infobip, Development)  
**Time to Add Provider:** ~30 minutes  
**Breaking Changes:** None (backwards compatible)

---

**Architecture Complete:** December 23, 2025
