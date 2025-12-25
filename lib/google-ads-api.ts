/**
 * Google Ads API OAuth Wrapper
 * 
 * Provides OAuth2 authentication and API client management for Google Ads.
 * Follows the pattern established in lib/google.ts for Google Calendar.
 * 
 * Key Features:
 * - OAuth2 token management with auto-refresh
 * - Database-backed token storage (google_ads_tokens table)
 * - GoogleAdsApi client instantiation with customer_id and developer_token
 * - Query wrappers for common operations
 * 
 * Dependencies:
 * - google-ads-api v21.0.0
 * - googleapis (for OAuth2Client)
 * - @supabase/supabase-js (for token storage)
 */

import { GoogleAdsApi } from 'google-ads-api';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const GOOGLE_ADS_API_TIMEOUT_MS = 30000; // 30 seconds

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
 * Timeout wrapper for Google Ads API calls
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`Google Ads API timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

/**
 * Creates OAuth2 client for Google Ads API
 * @param redirectUri - Optional redirect URI. If not provided, uses env var or returns null if missing credentials
 */
export function createGoogleAdsOAuthClient(redirectUri?: string) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const envRedirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;
  const finalRedirectUri = redirectUri || envRedirectUri;

  console.log('[Google Ads OAuth] Creating OAuth client with:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri: finalRedirectUri,
    source: redirectUri ? 'dynamic' : 'env',
  });

  if (!clientId || !clientSecret) {
    console.warn('[Google Ads OAuth] Missing credentials - Google Ads integration will be disabled');
    return null;
  }

  if (!finalRedirectUri) {
    console.warn('[Google Ads OAuth] Missing redirect URI - Google Ads integration will be disabled');
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, finalRedirectUri);
}

/**
 * Fetches Google Ads tokens from Supabase
 */
export async function getGoogleAdsTokensFromSupabase() {
  const { data, error } = await getSupabaseServer()
    .from('google_ads_tokens')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Returns an authorized Google Ads API client with refreshed access token
 * Returns null if Google Ads is not configured
 */
export async function getAuthorizedGoogleAdsClient() {
  const tokens = await getGoogleAdsTokensFromSupabase();

  if (!tokens || !tokens.refresh_token) {
    console.log('[Google Ads API] No tokens found - Google Ads integration not configured');
    return null;
  }

  const oAuth2Client = createGoogleAdsOAuthClient();
  
  if (!oAuth2Client) {
    console.log('[Google Ads API] OAuth client not available - Google Ads integration disabled');
    return null;
  }

  // Set credentials
  oAuth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token || undefined,
    expiry_date: tokens.expires_at ? new Date(tokens.expires_at).getTime() : undefined,
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
      console.log('[Google Ads API] Refreshing access token...');
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);

      // Update tokens in database
      await getSupabaseServer()
        .from('google_ads_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
          token_type: credentials.token_type,
          scope: credentials.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokens.id);

      console.log('[Google Ads API] ✓ Access token refreshed successfully');
    } catch (error) {
      console.error('[Google Ads API] Error refreshing access token:', error);
      throw new Error('Failed to refresh Google Ads access token');
    }
  }

  // Return authorized Google Ads API client
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: tokens.developer_token,
  });

  // Set refresh token on client
  client.Customer({
    customer_id: tokens.customer_id,
    refresh_token: tokens.refresh_token,
  });

  return {
    client,
    customerId: tokens.customer_id,
    loginCustomerId: tokens.login_customer_id || tokens.customer_id,
    refreshToken: tokens.refresh_token,
  };
}

/**
 * Query wrapper: Fetch campaigns for the authenticated customer
 * @param startDate - Start date in YYYY-MM-DD format (defaults to 30 days ago)
 * @param endDate - End date in YYYY-MM-DD format (defaults to today)
 */
export async function getCampaigns(
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  const adsClient = await getAuthorizedGoogleAdsClient();
  
  if (!adsClient) {
    console.log('[Google Ads API] Cannot fetch campaigns - not configured');
    return [];
  }

  const { client, customerId, refreshToken } = adsClient;

  // Default to 30-day window
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.conversions,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'
    ORDER BY metrics.cost_micros DESC
  `;

  try {
    const customer = client.Customer({ customer_id: customerId, refresh_token: refreshToken });
    const results = await withTimeout(
      customer.query(query),
      GOOGLE_ADS_API_TIMEOUT_MS
    );

    console.log('[Google Ads API] ✓ Fetched campaigns:', results.length);
    return results;
  } catch (error: any) {
    console.error('[Google Ads API] ✗ Error fetching campaigns:', {
      error: error.message,
      retryable: error.message?.includes('timeout') || error.code >= 500,
    });
    throw error;
  }
}

/**
 * Query wrapper: Fetch ad groups for the authenticated customer
 * @param campaignId - Optional campaign ID filter
 * @param startDate - Start date in YYYY-MM-DD format (defaults to 30 days ago)
 * @param endDate - End date in YYYY-MM-DD format (defaults to today)
 */
export async function getAdGroups(
  campaignId?: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  const adsClient = await getAuthorizedGoogleAdsClient();
  
  if (!adsClient) {
    console.log('[Google Ads API] Cannot fetch ad groups - not configured');
    return [];
  }

  const { client, customerId, refreshToken } = adsClient;

  // Default to 30-day window
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : '';

  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.type,
      campaign.id,
      campaign.name,
      metrics.cost_micros,
      metrics.conversions,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions_value
    FROM ad_group
    WHERE segments.date BETWEEN '${start}' AND '${end}'
    ${campaignFilter}
    ORDER BY metrics.cost_micros DESC
  `;

  try {
    const customer = client.Customer({ customer_id: customerId, refresh_token: refreshToken });
    const results = await withTimeout(
      customer.query(query),
      GOOGLE_ADS_API_TIMEOUT_MS
    );

    console.log('[Google Ads API] ✓ Fetched ad groups:', results.length);
    return results;
  } catch (error: any) {
    console.error('[Google Ads API] ✗ Error fetching ad groups:', {
      error: error.message,
      retryable: error.message?.includes('timeout') || error.code >= 500,
    });
    throw error;
  }
}

/**
 * Query wrapper: Fetch search terms (keyword performance) for the authenticated customer
 * @param campaignId - Optional campaign ID filter
 * @param adGroupId - Optional ad group ID filter
 * @param startDate - Start date in YYYY-MM-DD format (defaults to 30 days ago)
 * @param endDate - End date in YYYY-MM-DD format (defaults to today)
 */
export async function getSearchTerms(
  campaignId?: string,
  adGroupId?: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  const adsClient = await getAuthorizedGoogleAdsClient();
  
  if (!adsClient) {
    console.log('[Google Ads API] Cannot fetch search terms - not configured');
    return [];
  }

  const { client, customerId, refreshToken } = adsClient;

  // Default to 30-day window
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const campaignFilter = campaignId ? `AND campaign.id = ${campaignId}` : '';
  const adGroupFilter = adGroupId ? `AND ad_group.id = ${adGroupId}` : '';

  const query = `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      metrics.cost_micros,
      metrics.conversions,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions_value
    FROM search_term_view
    WHERE segments.date BETWEEN '${start}' AND '${end}'
    ${campaignFilter}
    ${adGroupFilter}
    ORDER BY metrics.cost_micros DESC
  `;

  try {
    const customer = client.Customer({ customer_id: customerId, refresh_token: refreshToken });
    const results = await withTimeout(
      customer.query(query),
      GOOGLE_ADS_API_TIMEOUT_MS
    );

    console.log('[Google Ads API] ✓ Fetched search terms:', results.length);
    return results;
  } catch (error: any) {
    console.error('[Google Ads API] ✗ Error fetching search terms:', {
      error: error.message,
      retryable: error.message?.includes('timeout') || error.code >= 500,
    });
    throw error;
  }
}

/**
 * Fetch accessible customer IDs for the authenticated account
 * Useful for MCC accounts that manage multiple customer accounts
 */
export async function getAccessibleCustomers(): Promise<string[]> {
  const adsClient = await getAuthorizedGoogleAdsClient();
  
  if (!adsClient) {
    console.log('[Google Ads API] Cannot fetch accessible customers - not configured');
    return [];
  }

  const { client, refreshToken } = adsClient;

  try {
    const response = await withTimeout(
      client.listAccessibleCustomers(refreshToken),
      GOOGLE_ADS_API_TIMEOUT_MS
    );

    const customers = response.resource_names || [];
    console.log('[Google Ads API] ✓ Fetched accessible customers:', customers.length);
    return customers;
  } catch (error: any) {
    console.error('[Google Ads API] ✗ Error fetching accessible customers:', {
      error: error.message,
      retryable: error.message?.includes('timeout') || error.code >= 500,
    });
    throw error;
  }
}

/**
 * Upload offline conversion to Google Ads
 * Used by the sync worker to report conversions from lead/booking events
 * 
 * @param params - Conversion parameters
 * @returns Upload result with success/error status
 */
export async function uploadOfflineConversion(params: {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  conversionAction: string;
  conversionDateTime: string;
  conversionValue?: number;
  currencyCode?: string;
  userIdentifierEmail?: string;
  userIdentifierPhone?: string;
}): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  retryable?: boolean;
}> {
  const adsClient = await getAuthorizedGoogleAdsClient();
  
  if (!adsClient) {
    console.log('[Google Ads API] Cannot upload conversion - not configured');
    return {
      success: false,
      error: 'Google Ads not configured',
      retryable: false,
    };
  }

  const { client, customerId, refreshToken } = adsClient;

  try {
    // Build conversion upload
    const clickConversion: any = {
      conversion_action: params.conversionAction,
      conversion_date_time: params.conversionDateTime,
    };

    // Add click identifier (gclid, gbraid, or wbraid)
    if (params.gclid) {
      clickConversion.gclid = params.gclid;
    } else if (params.gbraid) {
      clickConversion.gbraid = params.gbraid;
    } else if (params.wbraid) {
      clickConversion.wbraid = params.wbraid;
    }

    // Add conversion value
    if (params.conversionValue !== undefined) {
      clickConversion.conversion_value = params.conversionValue;
      clickConversion.currency_code = params.currencyCode || 'USD';
    }

    // Add user identifiers for enhanced conversions
    if (params.userIdentifierEmail || params.userIdentifierPhone) {
      clickConversion.user_identifiers = [];
      
      if (params.userIdentifierEmail) {
        // Hash email using SHA-256
        const crypto = await import('crypto');
        const emailHash = crypto.createHash('sha256')
          .update(params.userIdentifierEmail.toLowerCase().trim())
          .digest('hex');
        
        clickConversion.user_identifiers.push({
          hashed_email: emailHash,
        });
      }
      
      if (params.userIdentifierPhone) {
        // Hash phone using SHA-256 (must be E.164 format)
        const crypto = await import('crypto');
        const phoneHash = crypto.createHash('sha256')
          .update(params.userIdentifierPhone.replace(/\D/g, ''))
          .digest('hex');
        
        clickConversion.user_identifiers.push({
          hashed_phone_number: phoneHash,
        });
      }
    }

    // Upload conversion
    const customer = client.Customer({ customer_id: customerId, refresh_token: refreshToken });
    
    // Use the customer query method to upload conversion
    const uploadRequest = {
      customer_id: `customers/${customerId}`,
      conversions: [clickConversion],
      partial_failure: false,
      validate_only: false,
    };
    
    const response = await withTimeout(
      customer.conversionUploads.uploadClickConversions(uploadRequest as any),
      GOOGLE_ADS_API_TIMEOUT_MS
    );

    console.log('[Google Ads API] ✓ Uploaded offline conversion:', {
      gclid: params.gclid,
      gbraid: params.gbraid,
      wbraid: params.wbraid,
      value: params.conversionValue,
    });

    return {
      success: true,
      jobId: response.job_id?.toString() || crypto.randomUUID(),
    };

  } catch (error: any) {
    const retryable = error.message?.includes('timeout') || 
                     error.code >= 500 ||
                     error.message?.includes('RATE_LIMIT');

    console.error('[Google Ads API] ✗ Error uploading conversion:', {
      error: error.message,
      retryable,
    });

    return {
      success: false,
      error: error.message || 'Unknown error',
      retryable,
    };
  }
}

