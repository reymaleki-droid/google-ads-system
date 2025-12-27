/**
 * Google Ads Customer-Facing API Wrappers
 * 
 * Multi-tenant functions for customers to access their own Google Ads data.
 * Each customer connects their own account via OAuth.
 * 
 * KEY DIFFERENCES FROM lib/google-ads-api.ts:
 * - Multi-tenant: customer_id passed explicitly
 * - Customer-scoped: RLS ensures data isolation
 * - Read-only: No write operations
 * - Caching: Aggressive caching to reduce API calls
 */

import { createClient } from '@supabase/supabase-js';

const GOOGLE_ADS_API_VERSION = 'v15';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const CACHE_TTL_MINUTES = 30;

interface CustomerGoogleAdsAccount {
  id: string;
  customer_id: string;
  google_ads_customer_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  status: string;
  account_name?: string;
  currency_code?: string;
  timezone?: string;
}

/**
 * Get Supabase service client
 */
function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get customer's active Google Ads account
 */
export async function getCustomerGoogleAdsAccount(
  customerId: string
): Promise<CustomerGoogleAdsAccount | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('google_ads_accounts')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    console.log('[Google Ads Customer] No active account found for customer:', customerId);
    return null;
  }

  return data as CustomerGoogleAdsAccount;
}

/**
 * Refresh access token if expired
 */
async function refreshAccessToken(account: CustomerGoogleAdsAccount): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(account.expires_at);

  // Token still valid (with 5-minute buffer)
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return account.access_token;
  }

  console.log('[Google Ads Customer] Refreshing access token for customer:', account.customer_id);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Google Ads Customer] Token refresh failed:', error);
    
    // Mark account as expired
    const supabase = getSupabaseServiceClient();
    await supabase
      .from('google_ads_accounts')
      .update({ status: 'expired', last_error: error })
      .eq('id', account.id);
    
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  // Update database
  const supabase = getSupabaseServiceClient();
  await supabase
    .from('google_ads_accounts')
    .update({
      access_token: data.access_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  return data.access_token;
}

/**
 * Make authenticated Google Ads API request
 */
async function makeGoogleAdsRequest(
  account: CustomerGoogleAdsAccount,
  query: string
): Promise<any> {
  const accessToken = await refreshAccessToken(account);
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!developerToken) {
    throw new Error('Missing GOOGLE_ADS_DEVELOPER_TOKEN');
  }

  const customerIdWithoutDashes = account.google_ads_customer_id.replace(/-/g, '');
  const url = `${GOOGLE_ADS_API_BASE}/customers/${customerIdWithoutDashes}/googleAds:searchStream`;

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const responseTime = Date.now() - startTime;

    // Log API usage
    const supabase = getSupabaseServiceClient();
    await supabase.from('google_ads_api_usage').insert({
      customer_id: account.customer_id,
      google_ads_account_id: account.id,
      endpoint: 'googleAds:searchStream',
      method: 'POST',
      request_body: { query: query.substring(0, 500) }, // Truncate for storage
      status_code: response.status,
      response_time_ms: responseTime,
      operations_consumed: 1,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Google Ads Customer] API request failed:', error);
      throw new Error(`Google Ads API error: ${error}`);
    }

    return await response.json();
  } catch (error: any) {
    // Log error
    const supabase = getSupabaseServiceClient();
    await supabase.from('google_ads_api_usage').insert({
      customer_id: account.customer_id,
      google_ads_account_id: account.id,
      endpoint: 'googleAds:searchStream',
      method: 'POST',
      status_code: 500,
      error_message: error.message,
      operations_consumed: 1,
    });

    throw error;
  }
}

/**
 * Check cache for report data
 */
async function getCachedReport(
  customerId: string,
  accountId: string,
  reportType: string,
  dateRange: string
): Promise<any | null> {
  const supabase = getSupabaseServiceClient();

  const { data } = await supabase
    .from('google_ads_reports')
    .select('data, created_at')
    .eq('customer_id', customerId)
    .eq('google_ads_account_id', accountId)
    .eq('report_type', reportType)
    .eq('date_range', dateRange)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    console.log('[Google Ads Customer] Cache HIT:', { customerId, reportType, dateRange });
    return data.data;
  }

  console.log('[Google Ads Customer] Cache MISS:', { customerId, reportType, dateRange });
  return null;
}

/**
 * Store report in cache
 */
async function cacheReport(
  customerId: string,
  accountId: string,
  reportType: string,
  dateRange: string,
  data: any
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);

  await supabase.from('google_ads_reports').insert({
    customer_id: customerId,
    google_ads_account_id: accountId,
    report_type: reportType,
    date_range: dateRange,
    data,
    row_count: Array.isArray(data) ? data.length : 0,
    data_size_bytes: JSON.stringify(data).length,
    expires_at: expiresAt.toISOString(),
  });

  console.log('[Google Ads Customer] Report cached:', { customerId, reportType, dateRange, expiresAt });
}

/**
 * Fetch campaign performance (READ-ONLY)
 */
export async function fetchCustomerCampaignPerformance(
  customerId: string,
  dateRange: string = 'LAST_30_DAYS'
): Promise<any[]> {
  const account = await getCustomerGoogleAdsAccount(customerId);

  if (!account) {
    throw new Error('No Google Ads account connected');
  }

  // Check cache
  const cachedData = await getCachedReport(customerId, account.id, 'campaign_performance', dateRange);
  if (cachedData) {
    return cachedData;
  }

  // Fetch from API
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions_from_interactions_rate
    FROM campaign
    WHERE segments.date DURING ${dateRange}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;

  const response = await makeGoogleAdsRequest(account, query);

  const campaigns = (response.results || []).map((result: any) => ({
    id: result.campaign.id,
    name: result.campaign.name,
    status: result.campaign.status,
    impressions: parseInt(result.metrics.impressions) || 0,
    clicks: parseInt(result.metrics.clicks) || 0,
    cost_micros: parseInt(result.metrics.costMicros) || 0,
    cost: (parseInt(result.metrics.costMicros) || 0) / 1_000_000,
    conversions: parseFloat(result.metrics.conversions) || 0,
    ctr: parseFloat(result.metrics.ctr) || 0,
    cpc_micros: parseInt(result.metrics.averageCpc) || 0,
    cpc: (parseInt(result.metrics.averageCpc) || 0) / 1_000_000,
    conversion_rate: parseFloat(result.metrics.conversionsFromInteractionsRate) || 0,
  }));

  // Cache results
  await cacheReport(customerId, account.id, 'campaign_performance', dateRange, campaigns);

  return campaigns;
}

/**
 * Fetch keyword performance (READ-ONLY)
 */
export async function fetchCustomerKeywordPerformance(
  customerId: string,
  dateRange: string = 'LAST_30_DAYS'
): Promise<any[]> {
  const account = await getCustomerGoogleAdsAccount(customerId);

  if (!account) {
    throw new Error('No Google Ads account connected');
  }

  // Check cache
  const cachedData = await getCachedReport(customerId, account.id, 'keyword_performance', dateRange);
  if (cachedData) {
    return cachedData;
  }

  // Fetch from API
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.name,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM keyword_view
    WHERE segments.date DURING ${dateRange}
      AND ad_group_criterion.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 200
  `;

  const response = await makeGoogleAdsRequest(account, query);

  const keywords = (response.results || []).map((result: any) => ({
    keyword_text: result.adGroupCriterion.keyword.text,
    match_type: result.adGroupCriterion.keyword.matchType,
    campaign_name: result.campaign.name,
    ad_group_name: result.adGroup.name,
    impressions: parseInt(result.metrics.impressions) || 0,
    clicks: parseInt(result.metrics.clicks) || 0,
    cost_micros: parseInt(result.metrics.costMicros) || 0,
    cost: (parseInt(result.metrics.costMicros) || 0) / 1_000_000,
    conversions: parseFloat(result.metrics.conversions) || 0,
    ctr: parseFloat(result.metrics.ctr) || 0,
    cpc_micros: parseInt(result.metrics.averageCpc) || 0,
    cpc: (parseInt(result.metrics.averageCpc) || 0) / 1_000_000,
  }));

  // Cache results
  await cacheReport(customerId, account.id, 'keyword_performance', dateRange, keywords);

  return keywords;
}

/**
 * Fetch account summary (READ-ONLY)
 */
export async function fetchCustomerAccountSummary(customerId: string): Promise<any> {
  const account = await getCustomerGoogleAdsAccount(customerId);

  if (!account) {
    throw new Error('No Google Ads account connected');
  }

  const query = `
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM customer
    WHERE segments.date DURING LAST_30_DAYS
  `;

  const response = await makeGoogleAdsRequest(account, query);

  if (!response.results || response.results.length === 0) {
    throw new Error('No account data found');
  }

  const result = response.results[0];

  return {
    customer_id: result.customer.id,
    account_name: result.customer.descriptiveName,
    currency: result.customer.currencyCode,
    timezone: result.customer.timeZone,
    total_impressions: parseInt(result.metrics.impressions) || 0,
    total_clicks: parseInt(result.metrics.clicks) || 0,
    total_cost_micros: parseInt(result.metrics.costMicros) || 0,
    total_cost: (parseInt(result.metrics.costMicros) || 0) / 1_000_000,
    total_conversions: parseFloat(result.metrics.conversions) || 0,
  };
}

/**
 * Clear customer's report cache
 */
export async function clearCustomerReportCache(
  customerId: string,
  reportType?: string
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('google_ads_reports')
    .delete()
    .eq('customer_id', customerId);

  if (reportType) {
    query = query.eq('report_type', reportType);
  }

  await query;

  console.log('[Google Ads Customer] Cache cleared:', { customerId, reportType });
}

/**
 * Check if customer has connected Google Ads
 */
export async function hasGoogleAdsConnected(customerId: string): Promise<boolean> {
  const account = await getCustomerGoogleAdsAccount(customerId);
  return !!account;
}

/**
 * Disconnect customer's Google Ads account
 */
export async function disconnectCustomerGoogleAds(customerId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  await supabase
    .from('google_ads_accounts')
    .update({ status: 'disconnected' })
    .eq('customer_id', customerId);

  // Clear cache
  await clearCustomerReportCache(customerId);

  console.log('[Google Ads Customer] Account disconnected:', customerId);
}
