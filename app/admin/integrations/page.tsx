'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkConnection();
    checkGoogleAdsConnection();

    // Check for URL params
    const googleStatus = searchParams.get('google');
    const googleAdsStatus = searchParams.get('googleads');
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    if (googleStatus === 'connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      setIsConnected(true);
    } else if (googleAdsStatus === 'connected') {
      setMessage({ type: 'success', text: 'Google Ads connected successfully!' });
      setGoogleAdsConnected(true);
    } else if (error) {
      const errorText = errorMessage || error;
      setMessage({ type: 'error', text: decodeURIComponent(errorText) });
    }
  }, [searchParams]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/google/status');
      const data = await response.json();
      setIsConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleAdsConnection = async () => {
    try {
      setGoogleAdsLoading(true);
      const response = await fetch('/api/google-ads/status');
      const data = await response.json();
      setGoogleAdsConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking Google Ads connection:', error);
      setGoogleAdsConnected(false);
    } finally {
      setGoogleAdsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Integrations
            </h1>
            <p className="text-lg text-gray-600">
              Connect external services to automate your workflow
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border-2 ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Google Calendar</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Automatically create calendar events with Google Meet links for confirmed bookings
                  </CardDescription>
                </div>
                <div className="flex-shrink-0">
                  {loading ? (
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        isConnected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!loading && (
                <>
                  {isConnected ? (
                    <div className="space-y-4">
                      <p className="text-base text-gray-700">
                        Google Calendar is connected. Calendar events will be created automatically when bookings are confirmed.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.location.href = '/api/google/auth'}
                          variant="outline"
                          className="border-2"
                        >
                          Reconnect
                        </Button>
                        <Button
                          onClick={checkConnection}
                          variant="outline"
                          className="border-2"
                        >
                          Refresh Status
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-base text-gray-700">
                        Connect your Google Calendar to automatically create events with Meet links for customer bookings.
                      </p>
                      <p className="text-sm text-gray-600">
                        Required permissions: Calendar access to create and manage events
                      </p>
                      <Button
                        onClick={() => window.location.href = '/api/google/auth'}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        Connect Google Calendar
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Google Ads Integration Card */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Ads</CardTitle>
                  <CardDescription>Campaign performance tracking and optimization</CardDescription>
                </div>
                {googleAdsLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      googleAdsConnected
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {googleAdsConnected ? 'Connected' : 'Not Connected'}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {googleAdsLoading ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Checking Google Ads connection...</p>
                </div>
              ) : (
                <>
                  {googleAdsConnected ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded p-4">
                        <p className="text-green-800 font-medium mb-2">✓ Google Ads is connected</p>
                        <p className="text-sm text-green-700">
                          Your Google Ads account is synced and campaign data is being tracked.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/admin/google-ads" className="flex-1">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                            View Dashboard
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            window.location.href = '/api/google-ads/auth';
                          }}
                          variant="outline"
                          size="lg"
                          className="flex-1"
                        >
                          Reconnect
                        </Button>
                      </div>
                      <Button
                        onClick={checkGoogleAdsConnection}
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        Refresh Status
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        Connect your Google Ads account to track campaign performance, monitor spend, and optimize your advertising.
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">What you'll get:</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Real-time campaign performance metrics</li>
                          <li>• Search terms and keyword analysis</li>
                          <li>• Automated sync every 30 minutes</li>
                          <li>• Cost and conversion tracking</li>
                        </ul>
                      </div>
                      <Button
                        onClick={() => {
                          window.location.href = '/api/google-ads/auth';
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        Connect Google Ads
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
