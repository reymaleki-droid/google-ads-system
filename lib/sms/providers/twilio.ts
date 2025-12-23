/**
 * Twilio SMS Provider
 * Documentation: https://www.twilio.com/docs/sms/api
 */

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(
  config: TwilioConfig,
  phoneNumber: string,
  message: string
): Promise<SendResult> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: config.phoneNumber,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Map Twilio error codes to normalized errors
      const errorCode = data.code;
      let normalizedError = 'provider_error';

      if (errorCode === 21211 || errorCode === 21614) {
        normalizedError = 'invalid_phone';
      } else if (errorCode === 20429 || errorCode === 88888) {
        normalizedError = 'throttled';
      } else if (errorCode === 20003 || errorCode === 20005) {
        normalizedError = 'auth_failed';
      } else if (errorCode >= 30000 && errorCode < 40000) {
        normalizedError = 'provider_down';
      }

      return {
        success: false,
        error: data.message || 'Twilio API error',
        errorCode: normalizedError,
      };
    }

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
      errorCode: 'network_error',
    };
  }
}
