# SMS Providers

Provider-agnostic SMS interface for OTP delivery.

## Architecture

```
lib/sms.ts (main interface)
  ├── providers/twilio.ts
  ├── providers/aws-sns.ts
  ├── providers/infobip.ts
  └── providers/development.ts
```

## Usage

```typescript
import { sendOtp } from '@/lib/sms';

const result = await sendOtp({
  phone: '+14155552671',
  message: 'Your code is: 123456'
});

if (result.success) {
  console.log(`Sent via ${result.provider}, ID: ${result.messageId}`);
} else {
  console.error(`Error (${result.errorCode}): ${result.error}`);
}
```

## Providers

### Twilio SMS

**Environment Variables:**
```bash
SMS_PROVIDER=twilio_sms
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+14155551234
```

**Features:**
- ✅ Fully implemented
- ✅ Error mapping (invalid_phone, throttled, auth_failed, provider_down)
- ✅ Production-ready

**Documentation:** https://www.twilio.com/docs/sms/api

---

### AWS SNS

**Environment Variables:**
```bash
SMS_PROVIDER=aws_sns
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

**Features:**
- ⚠️  Placeholder implementation
- 📦 Requires: `npm install @aws-sdk/client-sns`
- 🔨 TODO: Uncomment implementation in `lib/sms/providers/aws-sns.ts`

**Documentation:** https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html

---

### Infobip

**Environment Variables:**
```bash
SMS_PROVIDER=infobip
INFOBIP_API_KEY=...
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_SENDER=YourBrand
```

**Features:**
- ✅ Fully implemented
- ✅ Error mapping
- ✅ Production-ready

**Documentation:** https://www.infobip.com/docs/api/channels/sms

---

### Development Mode

**Environment Variables:**
```bash
SMS_PROVIDER=development
```

**Features:**
- ✅ Logs OTPs to console (no real SMS)
- ✅ Perfect for local development
- ✅ Zero cost

**Example Output:**
```
============================================================
📱 [DEV MODE] SMS WOULD BE SENT
============================================================
To: +14155552671
Message: Your Google Ads System verification code is: 123456
============================================================
🔑 OTP CODE: 123456
```

---

## Normalized Response

All providers return the same interface:

```typescript
interface SendOTPResult {
  success: boolean;
  provider: string; // 'twilio_sms' | 'aws_sns' | 'infobip' | 'development'
  messageId?: string; // Provider's message ID
  error?: string; // Human-readable error
  errorCode?: string; // Normalized error code
}
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `invalid_phone` | Phone number format invalid | Ask user to re-enter |
| `throttled` | Rate limit exceeded | Retry after delay |
| `auth_failed` | Provider credentials invalid | Check env vars |
| `provider_down` | Provider service unavailable | Retry or switch provider |
| `network_error` | Network/connection error | Retry request |
| `not_configured` | Missing environment variables | Configure provider |

## Adding a New Provider

1. Create `lib/sms/providers/your-provider.ts`:

```typescript
export interface YourProviderConfig {
  apiKey: string;
  // ... other config
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(
  config: YourProviderConfig,
  phoneNumber: string,
  message: string
): Promise<SendResult> {
  // Your implementation
}
```

2. Import in `lib/sms.ts`:

```typescript
import * as YourProvider from './sms/providers/your-provider';
```

3. Add switch case in `sendOtp()`:

```typescript
case 'your_provider':
  return await sendViaYourProvider(phone, message);
```

4. Implement provider function:

```typescript
async function sendViaYourProvider(
  phoneNumber: string,
  message: string
): Promise<SendOTPResult> {
  const apiKey = process.env.YOUR_PROVIDER_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      provider: 'your_provider',
      error: 'Not configured',
      errorCode: 'not_configured',
    };
  }

  const result = await YourProvider.sendSMS(
    { apiKey },
    phoneNumber,
    message
  );

  return {
    ...result,
    provider: 'your_provider',
  };
}
```

## Testing

Run verification suite:

```bash
node scripts/verify-otp.mjs
```

Test specific provider:

```bash
# Development mode (logs to console)
SMS_PROVIDER=development node -e "
  import('@/lib/sms').then(({ sendOtp }) => 
    sendOtp({ phone: '+14155552671', message: 'Test: 123456' })
  )
"
```

## Migration Notes

**Before (tightly coupled):**
```typescript
import { sendSMS } from '@/lib/sms';
const result = await sendSMS(phone, message);
// Returns: { success, error?, messageId? }
```

**After (provider-agnostic):**
```typescript
import { sendOtp } from '@/lib/sms';
const result = await sendOtp({ phone, message });
// Returns: { success, provider, error?, errorCode?, messageId? }
```

**Breaking Changes:**
- Function renamed: `sendSMS()` → `sendOtp()`
- Parameters: `(phone, message)` → `({ phone, message })`
- Response includes: `provider` and `errorCode` fields

## Best Practices

1. **Always check `errorCode`** for specific error handling
2. **Log `provider` and `messageId`** for debugging
3. **Use development mode** for local testing (no SMS costs)
4. **Set up fallback provider** in production
5. **Monitor provider-specific error rates**

## Cost Comparison

| Provider | Cost per SMS (US) | Notes |
|----------|-------------------|-------|
| Twilio | ~$0.0079 | Most reliable, best docs |
| AWS SNS | ~$0.00645 | Cheaper, requires AWS setup |
| Infobip | ~$0.008 | Global reach, good for EU |
| Development | $0 | Local testing only |

## Support

- **Twilio:** https://support.twilio.com/
- **AWS SNS:** https://aws.amazon.com/support/
- **Infobip:** https://www.infobip.com/contact

---

**Last Updated:** December 23, 2025
