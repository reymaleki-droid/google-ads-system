import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase server client
let supabaseServerInstance: SupabaseClient | null = null;

function getSupabaseServer() {
  if (!supabaseServerInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabaseServerInstance;
}

/**
 * Creates OAuth2 client for Google API
 * @param redirectUri - Optional redirect URI. If not provided, uses env var or returns null if missing credentials
 */
export function createOAuthClient(redirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const envRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const finalRedirectUri = redirectUri || envRedirectUri;

  console.log('[Google OAuth] Creating OAuth client with:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri: finalRedirectUri,
    source: redirectUri ? 'dynamic' : 'env',
  });

  if (!clientId || !clientSecret) {
    console.warn('[Google OAuth] Missing credentials - Calendar integration will be disabled');
    return null;
  }

  if (!finalRedirectUri) {
    console.warn('[Google OAuth] Missing redirect URI - Calendar integration will be disabled');
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, finalRedirectUri);
}

/**
 * Fetches Google tokens from Supabase
 */
export async function getGoogleTokensFromSupabase() {
  const { data, error } = await getSupabaseServer()
    .from('google_tokens')
    .select('*')
    .eq('provider', 'google')
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Returns an authorized Google Calendar client with refreshed access token
 * Returns null if Calendar is not configured
 */
export async function getAuthorizedCalendarClient() {
  const tokens = await getGoogleTokensFromSupabase();

  if (!tokens || !tokens.refresh_token) {
    console.log('[Google Calendar] No tokens found - Calendar integration not configured');
    return null;
  }

  const oAuth2Client = createOAuthClient();
  
  if (!oAuth2Client) {
    console.log('[Google Calendar] OAuth client not available - Calendar integration disabled');
    return null;
  }

  // Set credentials
  oAuth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
    token_type: tokens.token_type || undefined,
    scope: tokens.scope || undefined,
  });

  // Check if access token needs refresh
  const tokenInfo = oAuth2Client.credentials;
  const now = Date.now();
  const expiryDate = tokenInfo.expiry_date || 0;

  // If token is expired or will expire in the next 5 minutes, refresh it
  if (!tokenInfo.access_token || expiryDate < now + 5 * 60 * 1000) {
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);

      // Update tokens in database
      await getSupabaseServer()
        .from('google_tokens')
        .update({
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date,
          token_type: credentials.token_type,
          scope: credentials.scope,
        })
        .eq('provider', 'google');
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  // Return authorized calendar client
  return google.calendar({ version: 'v3', auth: oAuth2Client });
}

/**
 * Creates a Google Calendar event with Meet link
 * Returns null if Calendar is not configured
 */
export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  attendeeEmail: string;
  timezone: string;
}) {
  console.log('[Google Calendar] Attempting to create calendar event...');
  
  const calendar = await getAuthorizedCalendarClient();
  
  if (!calendar) {
    console.log('[Google Calendar] Calendar integration not available - skipping event creation');
    return null;
  }

  // CRITICAL: params.start and params.end are already in UTC ISO format
  // Google Calendar expects UTC times WITHOUT timezone specification
  // If we add timeZone, Google interprets the time AS IF it's in that timezone (double conversion bug)
  // Example: "2025-12-24T10:00:00.000Z" with timeZone="Asia/Dubai" means "10:00 Dubai time" not "10:00 UTC"
  
  console.log('[Google Calendar] Creating event with UTC times:', {
    startUTC: params.start,
    endUTC: params.end,
    displayTimezone: params.timezone,
  });
  
  const event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.start,
      // DO NOT set timeZone - let Google use UTC from the ISO string
    },
    end: {
      dateTime: params.end,
      // DO NOT set timeZone - let Google use UTC from the ISO string
    },
    attendees: [{ email: params.attendeeEmail }],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
      sendUpdates: 'all', // Send email invites to attendees
    });

    console.log('[Google Calendar] ✓ Event created successfully:', response.data.id);

    return {
      eventId: response.data.id,
      meetUrl: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('[Google Calendar] ✗ Error creating calendar event:', error);
    throw error;
  }
}
