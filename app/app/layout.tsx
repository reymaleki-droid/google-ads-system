import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import Link from 'next/link';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'customer') {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/app/dashboard" className="text-xl font-bold text-gray-900">
                Google Ads Hub
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/app/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/app/campaigns"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Campaigns
                </Link>
                <Link 
                  href="/app/alerts"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Alerts
                </Link>
                <Link 
                  href="/app/integrations"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Integrations
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">{user.email}</span>
                <Link
                  href="/app/settings"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Settings
                </Link>
                <form action="/auth/signout" method="post">
                  <button 
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
