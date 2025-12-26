import { getServerUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function SettingsPage() {
  const user = await getServerUser();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-gray-900">{user?.email}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account Type</label>
            <div className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role === 'customer' ? 'Customer' : 'Administrator'}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">User ID</label>
            <div className="mt-1 text-gray-600 text-sm font-mono">{user?.id}</div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive alert emails for campaign issues</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Budget Alerts</h4>
              <p className="text-sm text-gray-600">Get notified when campaigns exceed budget thresholds</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Performance Alerts</h4>
              <p className="text-sm text-gray-600">Alert me when CPA or conversion rate changes significantly</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Billing & Subscription</CardTitle>
          <CardDescription>Manage your subscription and payment methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Current Plan</h4>
                <p className="text-sm text-gray-600 mt-1">Professional - $99/month</p>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </div>
          </div>
          <div>
            <Button variant="outline" className="w-full sm:w-auto">
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Sign Out</h4>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" className="text-gray-700">
                Sign Out
              </Button>
            </form>
          </div>
          <div className="flex items-start justify-between pt-4 border-t border-gray-200">
            <div>
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
