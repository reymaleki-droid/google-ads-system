'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ConnectGoogleAdsProps {
  isConnected: boolean;
  accountInfo?: {
    google_ads_customer_id: string;
    account_name?: string;
    currency_code?: string;
    status: string;
  };
  onRefresh?: () => void;
}

export function ConnectGoogleAds({ isConnected, accountInfo, onRefresh }: ConnectGoogleAdsProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = '/api/customer/google-ads/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Ads account? Your reports will no longer be accessible.')) {
      return;
    }

    setIsDisconnecting(true);

    try {
      const response = await fetch('/api/customer/google-ads/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Google Ads account disconnected successfully');
        if (onRefresh) onRefresh();
      } else {
        const error = await response.json();
        alert(`Failed to disconnect: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to disconnect Google Ads account');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Connect Google Ads
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connect your Google Ads account to view performance reports and insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What you'll get:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Campaign performance metrics</li>
                  <li>Keyword analysis reports</li>
                  <li>Cost and conversion tracking</li>
                  <li>Real-time dashboard updates</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Privacy:</span> We only request read-only access to your Google Ads data. We cannot modify campaigns or make changes to your account.
            </p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Google Ads'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Google Ads Connected
        </CardTitle>
        <CardDescription className="text-gray-600">
          Your Google Ads account is connected and syncing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer ID:</span>
              <span className="font-mono text-gray-900">{accountInfo.google_ads_customer_id}</span>
            </div>
            {accountInfo.account_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Account Name:</span>
                <span className="text-gray-900">{accountInfo.account_name}</span>
              </div>
            )}
            {accountInfo.currency_code && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Currency:</span>
                <span className="text-gray-900">{accountInfo.currency_code}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                accountInfo.status === 'active' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {accountInfo.status.charAt(0).toUpperCase() + accountInfo.status.slice(1)}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {isDisconnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Disconnecting...
            </>
          ) : (
            'Disconnect Google Ads'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
