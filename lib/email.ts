import { Resend } from 'resend';

// Gracefully handle missing API key during build
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = 'Audit Team <onboarding@resend.dev>';

const API_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  timeoutMs: number;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  config: RetryConfig = { maxAttempts: MAX_RETRIES, delayMs: 1000, timeoutMs: API_TIMEOUT_MS }
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await withTimeout(fn(), config.timeoutMs);
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = 
        error.message?.includes('timeout') ||
        error.statusCode === 429 || // Rate limit
        error.statusCode === 503 || // Service unavailable
        error.statusCode >= 500;    // Server errors
      
      if (!isRetryable || attempt >= config.maxAttempts) {
        throw error;
      }
      
      // Exponential backoff
      const delay = config.delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

interface BookingDetails {
  customerName: string;
  customerEmail: string;
  dateTime: string; // e.g., "Monday, December 23, 2025 at 1:00 PM"
  endTime: string; // e.g., "1:30 PM"
  timezone: string; // e.g., "Asia/Dubai"
  meetingLink?: string;
  bookingId: string;
  baseUrl?: string;
}

/**
 * Sends a booking confirmation email
 */
export async function sendConfirmationEmail(details: BookingDetails) {
  // Check if Resend is configured
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  const { 
    customerName, 
    customerEmail, 
    dateTime, 
    endTime,
    timezone, 
    meetingLink, 
    bookingId,
    baseUrl
  } = details;

  if (!baseUrl) {
    throw new Error('baseUrl is required for email generation');
  }

  const icsLink = `${baseUrl}/api/ics?booking_id=${bookingId}`;
  
  const meetingLinkSection = meetingLink 
    ? `
      <p style="margin: 24px 0;">
        <strong>Meeting Link:</strong><br/>
        <a href="${meetingLink}" style="color: #2563eb; text-decoration: underline;">${meetingLink}</a>
      </p>
    `
    : `
      <p style="margin: 24px 0; color: #6b7280;">
        <strong>Meeting Link:</strong> Will be shared shortly before the call.
      </p>
    `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background-color: #f3f4f6; padding: 32px; border-radius: 8px; margin-bottom: 24px;">
    <h1 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Your Google Ads Audit is Confirmed! 🎉</h1>
    <p style="margin: 0; font-size: 16px; color: #4b5563;">
      Hi ${customerName},
    </p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">Meeting Details</h2>
    
    <p style="margin: 16px 0;">
      <strong>Date & Time:</strong><br/>
      ${dateTime} - ${endTime}
    </p>

    <p style="margin: 16px 0; color: #6b7280; font-size: 14px;">
      <strong>Timezone:</strong> ${timezone} (GMT+4)
    </p>

    ${meetingLinkSection}

    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <a href="${icsLink}" 
         style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
        📅 Add to Calendar
      </a>
    </div>
  </div>

  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>⏰ Reminder:</strong> You'll receive a reminder email 1 hour before the meeting.
    </p>
  </div>

  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
    <p style="margin: 0 0 8px 0;">
      Need to reschedule or have questions? Reply to this email.
    </p>
    <p style="margin: 0;">
      Looking forward to helping you optimize your Google Ads!
    </p>
    <p style="margin: 16px 0 0 0; font-weight: 500;">
      — The Audit Team
    </p>
  </div>

</body>
</html>
  `.trim();

  console.log('[Email] RESEND_API_CALL_START', { to: customerEmail, bookingId });
  
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping email');
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    const { data, error } = await withRetryAndTimeout(() => 
      resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Confirmed: Google Ads Audit Call - ${dateTime}`,
        html,
      })
    );

    if (error) {
      console.error('[Email] RESEND_API_CALL_FAILED', { error: error.message, retryable: true });
      return { success: false, error: error.message };
    }

    console.log('[Email] RESEND_API_CALL_SUCCESS', { emailId: data?.id });
    console.log('[Email] ✓ Confirmation email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error: any) {
    console.error('[Email] RESEND_API_CALL_FATAL', { error: error.message, retryable: false });
    console.error('[Email] ✗ Failed to send confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a 1-hour reminder email before the meeting
 */
export async function sendReminderEmail(details: BookingDetails) {
  const { 
    customerName, 
    customerEmail, 
    dateTime, 
    endTime,
    timezone, 
    meetingLink, 
    bookingId,
    baseUrl
  } = details;

  if (!baseUrl) {
    throw new Error('baseUrl is required for reminder email generation');
  }  
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping reminder email');
    return { success: false, error: 'Email service not configured' };
  }
  const icsLink = `${baseUrl}/api/ics?booking_id=${bookingId}`;
  
  const meetingLinkSection = meetingLink 
    ? `
      <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">
          Join Meeting:
        </p>
        <a href="${meetingLink}" 
           style="color: #2563eb; text-decoration: underline; font-size: 16px; word-break: break-all;">
          ${meetingLink}
        </a>
      </div>
    `
    : `
      <p style="margin: 24px 0; color: #6b7280;">
        <strong>Meeting Link:</strong> Check your original confirmation email or we'll send it shortly.
      </p>
    `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background-color: #fef3c7; padding: 32px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
    <h1 style="margin: 0 0 8px 0; color: #111827; font-size: 24px;">Your Meeting Starts in 1 Hour!</h1>
    <p style="margin: 0; font-size: 16px; color: #4b5563;">
      Google Ads Audit Call
    </p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px 0; font-size: 16px;">
      Hi ${customerName},
    </p>
    
    <p style="margin: 0 0 24px 0;">
      This is a friendly reminder that your Google Ads audit call is coming up soon.
    </p>

    <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0;">
        <strong style="color: #111827;">Date & Time:</strong>
      </p>
      <p style="margin: 0; font-size: 18px; color: #2563eb; font-weight: 500;">
        ${dateTime}
      </p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
        ${endTime} (${timezone})
      </p>
    </div>

    ${meetingLinkSection}
  </div>

  <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #065f46;">
      <strong>💡 Pro Tip:</strong> Have your Google Ads account ready to share your screen for the audit.
    </p>
  </div>

  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center;">
    <a href="${icsLink}" 
       style="display: inline-block; color: #2563eb; text-decoration: underline; margin-bottom: 16px;">
      📅 Add to Calendar
    </a>
    <p style="margin: 0;">
      See you soon!<br/>
      <strong style="color: #1f2937;">— The Audit Team</strong>
    </p>
  </div>

</body>
</html>
  `.trim();

  try {
    const { data, error } = await withRetryAndTimeout(() =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `⏰ Reminder: Your Google Ads Audit Call in 1 Hour`,
        html,
      })
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, emailId: data?.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}
