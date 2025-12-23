// Google Ads Conversion Tracking
// Implements server-side conversion tracking for Google Ads using Enhanced Conversions

import { withRetryAndTimeout } from '../email';

const API_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;

export interface GoogleAdsConversionPayload {
  gclid?: string;
  conversion_action: string; // e.g., "AW-123456789/AbC-D_efG-h12_34-567"
  conversion_time: string; // ISO 8601 format
  conversion_value?: number;
  currency?: string;
  email?: string; // Hashed SHA-256
  phone?: string; // Hashed SHA-256 in E.164 format
  user_agent?: string;
  order_id?: string; // For dedupe on Google's side
}

export interface GoogleAdsConversionResult {
  success: boolean;
  error?: string;
  response?: any;
}

/**
 * Send conversion to Google Ads via Google Ads API
 * 
 * Requirements:
 * - GOOGLE_ADS_CUSTOMER_ID: Your Google Ads customer ID (10 digits)
 * - GOOGLE_ADS_CONVERSION_ACTION_ID: Conversion action ID from Google Ads
 * - GOOGLE_ADS_DEVELOPER_TOKEN: Developer token from Google Ads API
 * - GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN: OAuth credentials
 * 
 * @param payload - Conversion data
 * @returns Result with success/error
 */
export async function sendGoogleAdsConversion(
  payload: GoogleAdsConversionPayload
): Promise<GoogleAdsConversionResult> {
  try {
    // Check if Google Ads is configured
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const conversionActionId = process.env.GOOGLE_ADS_CONVERSION_ACTION_ID;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

    if (!customerId || !conversionActionId || !developerToken) {
      console.warn('[GoogleAds] Missing configuration - conversion marked pending');
      return {
        success: false,
        error: 'Google Ads not configured (missing GOOGLE_ADS_CUSTOMER_ID, CONVERSION_ACTION_ID, or DEVELOPER_TOKEN)',
      };
    }

    // If OAuth credentials are missing, we can't proceed
    if (!clientId || !clientSecret || !refreshToken) {
      console.warn('[GoogleAds] Missing OAuth credentials');
      return {
        success: false,
        error: 'Google Ads OAuth not configured',
      };
    }

    console.log('[GoogleAds] Sending conversion:', {
      gclid: payload.gclid,
      conversion_action: payload.conversion_action,
      conversion_time: payload.conversion_time,
      has_email: !!payload.email,
      has_phone: !!payload.phone,
    });

    // Get OAuth access token
    const accessToken = await getGoogleAdsAccessToken(clientId, clientSecret, refreshToken);

    // Build conversion upload request
    // Using Google Ads API v16 (offline conversion upload)
    const conversionData = {
      conversions: [
        {
          gclid: payload.gclid,
          conversion_action: `customers/${customerId}/conversionActions/${conversionActionId}`,
          conversion_date_time: payload.conversion_time,
          conversion_value: payload.conversion_value,
          currency_code: payload.currency || 'USD',
          order_id: payload.order_id,
          // Enhanced conversions (hashed user data)
          ...(payload.email || payload.phone
            ? {
                user_identifiers: [
                  ...(payload.email ? [{ hashed_email: payload.email }] : []),
                  ...(payload.phone ? [{ hashed_phone_number: payload.phone }] : []),
                ],
              }
            : {}),
        },
      ],
      partial_failure: false,
    };

    // Send to Google Ads API
    const response = await withRetryAndTimeout(
      () =>
        fetch(
          `https://googleads.googleapis.com/v16/customers/${customerId}:uploadClickConversions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              'developer-token': developerToken,
            },
            body: JSON.stringify(conversionData),
          }
        ).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(`Google Ads API error: ${JSON.stringify(data)}`);
          }
          return data;
        }),
      {
        maxAttempts: MAX_RETRIES,
        delayMs: 1000,
        timeoutMs: API_TIMEOUT_MS,
      }
    );

    console.log('[GoogleAds] Conversion sent successfully:', response);
    return { success: true, response };
  } catch (error: any) {
    console.error('[GoogleAds] Conversion send failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      response: error.response,
    };
  }
}

/**
 * Get OAuth access token for Google Ads API
 */
async function getGoogleAdsAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Hash email for Google Ads Enhanced Conversions
 * Must be lowercase, trimmed, and SHA-256 hashed
 */
export async function hashForGoogleAds(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
