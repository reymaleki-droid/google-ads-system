/**
 * Infobip SMS Provider
 * Documentation: https://www.infobip.com/docs/api/channels/sms
 */

export interface InfobipConfig {
  apiKey: string;
  baseUrl: string; // e.g., https://api.infobip.com
  sender: string; // Sender ID
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(
  config: InfobipConfig,
  phoneNumber: string,
  message: string
): Promise<SendResult> {
  try {
    const url = `${config.baseUrl}/sms/2/text/advanced`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            from: config.sender,
            destinations: [{ to: phoneNumber }],
            text: message,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Map Infobip error codes to normalized errors
      let normalizedError = 'provider_error';
      
      if (data.requestError?.serviceException?.messageId === 'BAD_REQUEST') {
        normalizedError = 'invalid_phone';
      } else if (response.status === 429) {
        normalizedError = 'throttled';
      } else if (response.status === 401 || response.status === 403) {
        normalizedError = 'auth_failed';
      } else if (response.status >= 500) {
        normalizedError = 'provider_down';
      }

      return {
        success: false,
        error: data.requestError?.serviceException?.text || 'Infobip API error',
        errorCode: normalizedError,
      };
    }

    // Extract message ID from first message in response
    const messageId = data.messages?.[0]?.messageId;

    return {
      success: true,
      messageId: messageId || 'unknown',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
      errorCode: 'network_error',
    };
  }
}
