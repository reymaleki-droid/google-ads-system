import { getServerUser, createAuthenticatedClient } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function IntegrationsPage() {
  const user = await getServerUser();
  const supabase = createAuthenticatedClient();

  // Check Google Ads connection
  const { data: googleAdsToken } = await supabase
    .from('google_ads_tokens')
    .select('*')
    .eq('customer_id', user!.id)
    .eq('is_active', true)
    .single();

  const isGoogleAdsConnected = !!googleAdsToken;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your accounts to unlock powerful insights
        </p>
      </div>

      {/* Google Ads Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <div>
                <CardTitle>Google Ads</CardTitle>
                <CardDescription>
                  {isGoogleAdsConnected 
                    ? 'Connected and syncing campaign data' 
                    : 'Connect your Google Ads account to start tracking performance'}
                </CardDescription>
              </div>
            </div>
            <div>
              {isGoogleAdsConnected ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-500">Not Connected</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGoogleAdsConnected ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ Your Google Ads account is connected and we're syncing your campaign data every hour.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">
                  Refresh Data Now
                </Button>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">What you'll get:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Real-time campaign performance tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Budget alerts and anomaly detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Conversion tracking and ROI insights</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/api/google-ads/auth">Connect Google Ads</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon Integrations */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-gray-600">Meta Ads</CardTitle>
                <CardDescription>
                  Track Facebook and Instagram ad performance
                </CardDescription>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
          </div>
        </CardHeader>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-gray-600">Slack Notifications</CardTitle>
                <CardDescription>
                  Get alerts in your Slack workspace
                </CardDescription>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
