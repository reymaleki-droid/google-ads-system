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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkConnection();

    // Check for URL params
    const googleStatus = searchParams.get('google');
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    if (googleStatus === 'connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
      setIsConnected(true);
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
