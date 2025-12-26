/**
 * Google Ads Admin Dashboard
 * 
 * Shows:
 * - Connection status
 * - Campaign performance (last 30 days)
 * - Conversion sync status
 * - OAuth reconnection button
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Insights {
  configured: boolean;
  dateRange?: {
    start: string;
    end: string;
    days: number;
  };
  summary?: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionValue: number;
    ctr: number;
    conversionRate: number;
    costPerConversion: number;
    roas: number;
  };
  campaigns?: Array<{
    id: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionValue: number;
    averageCpc: number;
  }>;
}

export default function GoogleAdsAdminPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const adminSecret = prompt('Enter ADMIN_SECRET:');
      if (!adminSecret) {
        setError('Admin secret required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/google-ads/insights?days=30', {
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }

      setInsights(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = () => {
    window.location.href = '/api/google-ads/auth';
  };

  // Admin Header Component
  const AdminHeader = () => (
    <header className="bg-white shadow mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Website
          </Link>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex space-x-4 border-b border-gray-200">
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Leads
          </Link>
          <Link
            href="/admin/google-ads"
            className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 transition-colors"
          >
            Google Ads
          </Link>
          <Link
            href="/admin/integrations"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Integrations
          </Link>
        </nav>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Error Loading Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchInsights} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!insights?.configured) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900">Google Ads Not Connected</CardTitle>
              <CardDescription>
                Connect your Google Ads account to view performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleReconnect} className="bg-blue-600 hover:bg-blue-700 text-white">
                Connect Google Ads
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { summary, campaigns, dateRange } = insights;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Ads Performance</h1>
          <p className="text-gray-600">
            {dateRange?.start} to {dateRange?.end} ({dateRange?.days} days)
          </p>
        </div>
        <Button onClick={handleReconnect} variant="outline">
          Reconnect Account
        </Button>
      </div>

      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Impressions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.impressions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.clicks.toLocaleString()}</div>
              <p className="text-sm text-gray-500">CTR: {summary.ctr}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Spend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-sm text-gray-500">Avg CPC: ${(summary.cost / summary.clicks).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.conversions.toFixed(0)}</div>
              <p className="text-sm text-gray-500">Rate: {summary.conversionRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Cost Per Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                ${summary.costPerConversion.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                ${summary.conversionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">
                {summary.roas.toFixed(2)}x
              </div>
              <p className="text-sm text-gray-500">Return on Ad Spend</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign List */}
      {campaigns && campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Top campaigns by spend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Campaign</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Impressions</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Clicks</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Conversions</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{campaign.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          campaign.status === 'ENABLED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{campaign.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{campaign.clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">${campaign.cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{campaign.conversions.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right">
                        ${campaign.conversions > 0 ? (campaign.cost / campaign.conversions).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </main>
    </div>
  );
}
