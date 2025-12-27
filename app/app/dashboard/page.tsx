import { getServerUser, createAuthenticatedClient } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CustomerDashboard() {
  const user = await getServerUser();
  const supabase = await createAuthenticatedClient();

  // Fetch customer's leads count
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user!.id);

  // Fetch customer's bookings count
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user!.id);

  // Check Google Ads connection status
  const { data: googleAdsToken } = await supabase
    .from('google_ads_tokens')
    .select('*')
    .eq('customer_id', user!.id)
    .eq('is_active', true)
    .single();

  const isGoogleAdsConnected = !!googleAdsToken;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your Google Ads performance
        </p>
      </div>

      {/* Google Ads Connection Status */}
      {!isGoogleAdsConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Connect Your Google Ads Account</CardTitle>
            <CardDescription className="text-yellow-700">
              Start by connecting your Google Ads account to see campaign insights and performance data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/app/integrations">
                Connect Google Ads
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{leadsCount || 0}</div>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{bookingsCount || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cost Per Lead</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">$--</div>
            <p className="text-sm text-gray-500 mt-1">
              {isGoogleAdsConnected ? 'Calculating...' : 'Connect Google Ads'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget Used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">$--</div>
            <p className="text-sm text-gray-500 mt-1">
              {isGoogleAdsConnected ? 'This month' : 'Connect Google Ads'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {isGoogleAdsConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your Google Ads campaigns</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href="/app/campaigns">View Campaigns</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/alerts">Check Alerts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/integrations">Manage Integrations</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State for New Customers */}
      {isGoogleAdsConnected && leadsCount === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Your campaigns are now connected. Data will start appearing here within 24 hours.
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Your dashboard is ready
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                We're syncing your Google Ads data. Check back soon to see your campaign performance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
