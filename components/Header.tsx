import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              GoogleAds Pro
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link href="/google-ads" className="text-gray-700 hover:text-blue-600">
              Google Ads
            </Link>
            <Link href="/google-ads/packages" className="text-gray-700 hover:text-blue-600">
              Packages
            </Link>
            <Link href="/case-studies" className="text-gray-700 hover:text-blue-600">
              Case Studies
            </Link>
          </div>
          <div>
            <Link
              href="/free-audit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Free Audit
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
