'use client';

import { useEffect, useState } from 'react';
import { MetricsCard } from '@/app/components/customer/MetricsCard';
import { ReportTable } from '@/app/components/customer/ReportTable';
import { DateRangePicker, DateRange } from '@/app/components/customer/DateRangePicker';
import { ConnectGoogleAds } from '@/app/components/customer/ConnectGoogleAds';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, TrendingUp, MousePointerClick, DollarSign, Target } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  account?: {
    google_ads_customer_id: string;
    account_name?: string;
    currency_code?: string;
    status: string;
  };
}

interface CampaignData {
  campaigns: any[];
  summary: {
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    totalConversions: number;
    avgCtr: number;
    avgCpc: number;
  };
}

export default function ReportsPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('last_30_days');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/customer/google-ads/status');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error('Failed to fetch connection status:', error);
    }
  };

  const fetchCampaignData = async () => {
    setRefreshing(true);
    try {
      const googleAdsDateRange = dateRange.toUpperCase().replace(/_/g, '_');
      const response = await fetch(`/api/customer/google-ads/campaigns?dateRange=${googleAdsDateRange}`);
      
      if (response.ok) {
        const data = await response.json();
        setCampaignData(data);
      } else {
        console.error('Failed to fetch campaign data');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchConnectionStatus();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (connectionStatus?.connected) {
      fetchCampaignData();
    }
  }, [connectionStatus, dateRange]);

  const handleRefresh = async () => {
    await fetchConnectionStatus();
    if (connectionStatus?.connected) {
      await fetchCampaignData();
    }
  };

  const handleExport = () => {
    if (!campaignData?.campaigns) return;
    
    // Simple CSV export
    const headers = ['Campaign', 'Impressions', 'Clicks', 'Cost', 'Conversions', 'CTR', 'CPC'];
    const rows = campaignData.campaigns.map(c => [
      c.name,
      c.impressions_raw,
      c.clicks_raw,
      c.cost_raw,
      c.conversions_raw,
      c.ctr_raw,
      c.cpc_raw,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-ads-report-${dateRange}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!connectionStatus?.connected) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Ads Reports</h1>
          <p className="text-gray-600">Connect your Google Ads account to view performance insights</p>
        </div>
        <ConnectGoogleAds
          isConnected={false}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Ads Performance</h1>
          <p className="text-gray-600 mt-1">Track your campaign metrics and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            disabled={!campaignData?.campaigns?.length}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      {campaignData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Impressions"
            value={campaignData.summary.totalImpressions}
            format="number"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricsCard
            title="Total Clicks"
            value={campaignData.summary.totalClicks}
            format="number"
            icon={<MousePointerClick className="w-5 h-5" />}
          />
          <MetricsCard
            title="Total Cost"
            value={campaignData.summary.totalCost}
            format="currency"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricsCard
            title="Total Conversions"
            value={campaignData.summary.totalConversions}
            format="number"
            icon={<Target className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Campaign Performance Table */}
      <ReportTable
        title="Campaign Performance"
        columns={[
          { key: 'name', label: 'Campaign', format: 'text', align: 'left' },
          { key: 'status', label: 'Status', format: 'text', align: 'left' },
          { key: 'impressions', label: 'Impressions', format: 'number', align: 'right' },
          { key: 'clicks', label: 'Clicks', format: 'number', align: 'right' },
          { key: 'cost', label: 'Cost', format: 'currency', align: 'right' },
          { key: 'conversions', label: 'Conversions', format: 'number', align: 'right' },
          { key: 'ctr', label: 'CTR', format: 'percentage', align: 'right' },
          { key: 'cpc', label: 'CPC', format: 'currency', align: 'right' },
        ]}
        data={campaignData?.campaigns || []}
        loading={refreshing}
        emptyMessage="No campaign data available for the selected date range"
      />
    </div>
  );
}
