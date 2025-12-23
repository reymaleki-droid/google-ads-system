// Meta Conversions API (CAPI)
// Implements server-side conversion tracking for Meta/Facebook

import { withRetryAndTimeout } from '../email';

const API_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;

export interface MetaCapiEventPayload {
  event_name: string; // e.g., "Lead", "Purchase", "CompleteRegistration"
  event_time: number; // Unix timestamp in seconds
  event_id?: string; // Dedupe ID (matches client-side event_id if present)
  event_source_url?: string; // Landing page URL
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  
  // User Data (hashed)
  user_data: {
    em?: string; // Email (SHA-256)
    ph?: string; // Phone (SHA-256, E.164 format)
    client_ip_address?: string; // IP address (not hashed)
    client_user_agent?: string; // User agent (not hashed)
    fbp?: string; // Facebook browser ID (_fbp cookie)
    fbc?: string; // Facebook click ID (_fbc cookie or fbclid)
  };
  
  // Custom Data (conversion value, etc.)
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
  };
}

export interface MetaCapiResult {
  success: boolean;
  error?: string;
  response?: any;
}

/**
 * Send conversion event to Meta Conversions API
 * 
 * Requirements:
 * - META_PIXEL_ID: Your Meta Pixel ID
 * - META_CAPI_ACCESS_TOKEN: Conversions API access token from Meta Events Manager
 * 
 * @param payload - Event data
 * @returns Result with success/error
 */
export async function sendMetaCapiEvent(
  payload: MetaCapiEventPayload
): Promise<MetaCapiResult> {
  try {
    // Check if Meta CAPI is configured
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.warn('[MetaCAPI] Missing configuration - event marked pending');
      return {
        success: false,
        error: 'Meta CAPI not configured (missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN)',
      };
    }

    console.log('[MetaCAPI] Sending event:', {
      event_name: payload.event_name,
      event_time: payload.event_time,
      event_id: payload.event_id,
      has_email: !!payload.user_data.em,
      has_phone: !!payload.user_data.ph,
      has_fbclid: !!payload.user_data.fbc,
    });

    // Build CAPI request
    const eventData = {
      data: [
        {
          event_name: payload.event_name,
          event_time: payload.event_time,
          event_id: payload.event_id,
          event_source_url: payload.event_source_url,
          action_source: payload.action_source,
          user_data: {
            ...payload.user_data,
            // Meta requires specific format
            ...(payload.user_data.em ? { em: [payload.user_data.em] } : {}),
            ...(payload.user_data.ph ? { ph: [payload.user_data.ph] } : {}),
          },
          custom_data: payload.custom_data,
        },
      ],
    };

    // Send to Meta Conversions API
    const response = await withRetryAndTimeout(
      () =>
        fetch(
          `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        ).then(async (res) => {
          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(`Meta CAPI error: ${JSON.stringify(data)}`);
          }
          return data;
        }),
      {
        maxAttempts: MAX_RETRIES,
        delayMs: 1000,
        timeoutMs: API_TIMEOUT_MS,
      }
    );

    console.log('[MetaCAPI] Event sent successfully:', response);
    return { success: true, response };
  } catch (error: any) {
    console.error('[MetaCAPI] Event send failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      response: error.response,
    };
  }
}

/**
 * Hash email or phone for Meta CAPI
 * Must be lowercase, trimmed, and SHA-256 hashed
 */
export async function hashForMeta(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build FBC parameter from fbclid
 * Format: fb.{version}.{timestamp}.{fbclid}
 */
export function buildFbcFromFbclid(fbclid: string, timestamp: number): string {
  return `fb.1.${timestamp}.${fbclid}`;
}
