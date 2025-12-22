'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const packageDetails = {
  Starter: {
    name: 'Starter Package',
    subtitle: 'Validation',
    description: 'Perfect for testing and validating your Google Ads strategy.',
    features: [
      'Initial campaign setup',
      'Keyword research',
      'Monthly reporting',
    ],
  },
  Growth: {
    name: 'Growth Package',
    subtitle: 'Optimization',
    description: 'Ideal for scaling with advanced optimization techniques.',
    features: [
      'Advanced campaign optimization',
      'A/B testing',
      'Remarketing campaigns',
      'Bi-weekly calls',
    ],
  },
  Scale: {
    name: 'Scale Package',
    subtitle: 'Governance',
    description: 'Enterprise-level management for maximum performance.',
    features: [
      'Multi-channel strategy',
      'Dedicated account manager',
      'Custom dashboards',
      'Weekly strategic calls',
    ],
  },
};

export default function ThankYouContent() {
  const searchParams = useSearchParams();
  const packageName = searchParams.get('pkg') as 'starter' | 'growth' | 'scale' || 'growth';
  const score = searchParams.get('score') || '0';
  
  // Map package names to display format
  const packageDisplayMap = {
    'starter': 'Starter',
    'growth': 'Growth',
    'scale': 'Scale'
  };
  
  const displayPackageName = packageDisplayMap[packageName] || 'Growth';
  const pkg = packageDetails[displayPackageName as 'Starter' | 'Growth' | 'Scale'];

  return (
    <main className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Thank You! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We&apos;ve received your request for a free Google Ads audit.
          </p>

          {/* Recommended Package */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Recommended for You: {pkg.name}
            </h2>
            <p className="text-blue-600 font-semibold mb-3">{pkg.subtitle}</p>
            <p className="text-gray-700 mb-4">{pkg.description}</p>
            <ul className="space-y-2">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h3>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 text-sm font-bold">
                  1
                </span>
                <span className="text-gray-700">
                  Our team will review your submission within 24 hours
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 text-sm font-bold">
                  2
                </span>
                <span className="text-gray-700">
                  We&apos;ll send you a comprehensive audit of your current situation
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mr-3 text-sm font-bold">
                  3
                </span>
                <span className="text-gray-700">
                  Schedule a call to discuss your personalized strategy
                </span>
              </li>
            </ol>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
            <Link
              href="/google-ads/packages"
              className="inline-block bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              View All Packages
            </Link>
          </div>

          {/* Debug info (optional, remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 text-sm text-gray-500">
              Lead Score: {score} | Package: {packageName}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
