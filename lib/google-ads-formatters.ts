/**
 * Google Ads Report Formatting Utilities
 * 
 * Transform raw Google Ads API data into user-friendly formats for display.
 * Handles currency formatting, percentage formatting, and data aggregation.
 */

/**
 * Format currency value (from micros)
 */
export function formatCurrency(micros: number, currencyCode: string = 'USD'): string {
  const value = micros / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage (from decimal)
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Calculate summary metrics from campaign data
 */
export function calculateCampaignSummary(campaigns: any[]): {
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  avgConversionRate: number;
} {
  if (campaigns.length === 0) {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalCost: 0,
      totalConversions: 0,
      avgCtr: 0,
      avgCpc: 0,
      avgConversionRate: 0,
    };
  }

  const totals = campaigns.reduce(
    (acc, campaign) => ({
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
      cost: acc.cost + campaign.cost,
      conversions: acc.conversions + campaign.conversions,
      ctr: acc.ctr + campaign.ctr,
      cpc: acc.cpc + campaign.cpc,
      conversionRate: acc.conversionRate + campaign.conversion_rate,
    }),
    {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      conversionRate: 0,
    }
  );

  return {
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalCost: totals.cost,
    totalConversions: totals.conversions,
    avgCtr: totals.ctr / campaigns.length,
    avgCpc: totals.cpc / campaigns.length,
    avgConversionRate: totals.conversionRate / campaigns.length,
  };
}

/**
 * Format campaign performance data for table display
 */
export function formatCampaignForTable(campaign: any, currencyCode: string = 'USD'): any {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    impressions: formatNumber(campaign.impressions),
    impressions_raw: campaign.impressions,
    clicks: formatNumber(campaign.clicks),
    clicks_raw: campaign.clicks,
    cost: formatCurrency(campaign.cost_micros || campaign.cost * 1_000_000, currencyCode),
    cost_raw: campaign.cost,
    conversions: campaign.conversions.toFixed(2),
    conversions_raw: campaign.conversions,
    ctr: formatPercentage(campaign.ctr),
    ctr_raw: campaign.ctr,
    cpc: formatCurrency(campaign.cpc_micros || campaign.cpc * 1_000_000, currencyCode),
    cpc_raw: campaign.cpc,
    conversion_rate: formatPercentage(campaign.conversion_rate),
    conversion_rate_raw: campaign.conversion_rate,
  };
}

/**
 * Format keyword performance data for table display
 */
export function formatKeywordForTable(keyword: any, currencyCode: string = 'USD'): any {
  return {
    keyword_text: keyword.keyword_text,
    match_type: keyword.match_type,
    campaign_name: keyword.campaign_name,
    ad_group_name: keyword.ad_group_name,
    impressions: formatNumber(keyword.impressions),
    impressions_raw: keyword.impressions,
    clicks: formatNumber(keyword.clicks),
    clicks_raw: keyword.clicks,
    cost: formatCurrency(keyword.cost_micros || keyword.cost * 1_000_000, currencyCode),
    cost_raw: keyword.cost,
    conversions: keyword.conversions.toFixed(2),
    conversions_raw: keyword.conversions,
    ctr: formatPercentage(keyword.ctr),
    ctr_raw: keyword.ctr,
    cpc: formatCurrency(keyword.cpc_micros || keyword.cpc * 1_000_000, currencyCode),
    cpc_raw: keyword.cpc,
  };
}

/**
 * Prepare data for chart visualization
 */
export function prepareChartData(
  campaigns: any[],
  metric: 'impressions' | 'clicks' | 'cost' | 'conversions' | 'ctr' | 'cpc'
): { labels: string[]; values: number[] } {
  return {
    labels: campaigns.map((c) => c.name),
    values: campaigns.map((c) => {
      if (metric === 'cost') return c.cost;
      if (metric === 'cpc') return c.cpc;
      return c[metric];
    }),
  };
}

/**
 * Export data to CSV format
 */
export function exportToCsv(
  data: any[],
  filename: string = 'google-ads-report.csv'
): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]).filter((key) => !key.endsWith('_raw'));
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Date range presets
 */
export const DATE_RANGE_PRESETS = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'Last 7 days', value: 'LAST_7_DAYS' },
  { label: 'Last 14 days', value: 'LAST_14_DAYS' },
  { label: 'Last 30 days', value: 'LAST_30_DAYS' },
  { label: 'This month', value: 'THIS_MONTH' },
  { label: 'Last month', value: 'LAST_MONTH' },
];

/**
 * Get date range label for display
 */
export function getDateRangeLabel(dateRange: string): string {
  const preset = DATE_RANGE_PRESETS.find((p) => p.value === dateRange);
  return preset ? preset.label : dateRange;
}

/**
 * Calculate cost per acquisition (CPA)
 */
export function calculateCpa(cost: number, conversions: number): number {
  if (conversions === 0) return 0;
  return cost / conversions;
}

/**
 * Calculate return on ad spend (ROAS)
 */
export function calculateRoas(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return revenue / cost;
}

/**
 * Format status badge color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'enabled':
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'removed':
    case 'disabled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format match type badge
 */
export function getMatchTypeLabel(matchType: string): string {
  switch (matchType) {
    case 'EXACT':
      return 'Exact';
    case 'PHRASE':
      return 'Phrase';
    case 'BROAD':
      return 'Broad';
    default:
      return matchType;
  }
}
