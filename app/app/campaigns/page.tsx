import { getServerUser, createAuthenticatedClient } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CampaignsPage() {
  const user = await getServerUser();
  const supabase = createAuthenticatedClient();

  // Fetch customer's campaigns
  const { data: campaigns, error } = await supabase
    .from('google_ads_campaigns')
    .select('*')
    .eq('customer_id', user!.id)
    .order('created_at', { ascending: false });

  // Check if Google Ads is connected
  const { data: googleAdsToken } = await supabase
    .from('google_ads_tokens')
    .select('*')
    .eq('customer_id', user!.id)
    .eq('is_active', true)
    .single();

  const isConnected = !!googleAdsToken;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-2">
            View and manage your Google Ads campaigns
          </p>
        </div>
        {isConnected && (
          <Button asChild>
            <Link href="/app/integrations">Refresh Data</Link>
          </Button>
        )}
      </div>

      {!isConnected && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Connect Google Ads</CardTitle>
            <CardDescription className="text-blue-700">
              Connect your Google Ads account to see campaign data and performance insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/app/integrations">Connect Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {isConnected && (!campaigns || campaigns.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No Campaigns Found</CardTitle>
            <CardDescription>
              We're syncing your campaigns from Google Ads. This may take a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-sm text-gray-600">
                Check back in a few minutes to see your campaigns
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      Status: <span className={campaign.status === 'ENABLED' ? 'text-green-600' : 'text-gray-600'}>
                        {campaign.status || 'Unknown'}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Impressions</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {campaign.impressions?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Clicks</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {campaign.clicks?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Cost</div>
                    <div className="text-xl font-semibold text-gray-900">
                      ${(campaign.cost_micros ? campaign.cost_micros / 1000000 : 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Conversions</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {campaign.conversions || '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
