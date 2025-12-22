import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import Link from 'next/link';

const packages = [
  {
    name: 'Starter',
    subtitle: 'Validation Package',
    price: 'Custom Pricing',
    description: 'Perfect for businesses testing Google Ads or working with smaller budgets.',
    features: [
      'Initial campaign setup & strategy',
      'Keyword research & selection',
      'Ad copy creation (up to 10 ads)',
      'Basic conversion tracking',
      'Monthly performance report',
      'Email support',
      'Suitable for budgets: $1,000-$2,000/month',
    ],
    cta: 'Get Started',
    recommended: false,
  },
  {
    name: 'Growth',
    subtitle: 'Optimization Package',
    price: 'Custom Pricing',
    description: 'Ideal for businesses ready to scale with proven optimization strategies.',
    features: [
      'Everything in Starter, plus:',
      'Advanced campaign optimization',
      'A/B testing & experimentation',
      'Landing page recommendations',
      'Remarketing campaigns',
      'Bi-weekly performance calls',
      'Priority support',
      'Suitable for budgets: $2,000-$5,000/month',
    ],
    cta: 'Get Started',
    recommended: true,
  },
  {
    name: 'Scale',
    subtitle: 'Governance Package',
    price: 'Custom Pricing',
    description: 'Enterprise-level management for businesses with significant ad spend.',
    features: [
      'Everything in Growth, plus:',
      'Multi-channel strategy integration',
      'Advanced attribution modeling',
      'Custom reporting dashboards',
      'Dedicated account manager',
      'Weekly strategic calls',
      'Quarterly business reviews',
      '24/7 priority support',
      'Suitable for budgets: $5,000+/month',
    ],
    cta: 'Get Started',
    recommended: false,
  },
];

export default function PackagesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Google Ads Management Packages
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Choose the package that aligns with your business goals and budget. 
              All packages include expert management and ongoing optimization.
            </p>
          </div>
        </section>

        {/* Packages Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`rounded-lg border-2 p-8 relative ${
                    pkg.recommended
                      ? 'border-blue-600 shadow-xl'
                      : 'border-gray-200'
                  }`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {pkg.name}
                    </h3>
                    <p className="text-blue-600 font-semibold mb-3">
                      {pkg.subtitle}
                    </p>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      {pkg.price}
                    </div>
                    <p className="text-gray-600">{pkg.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
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
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/free-audit"
                    className={`block text-center py-3 px-6 rounded-lg font-semibold transition ${
                      pkg.recommended
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">
                  How do I know which package is right for me?
                </h3>
                <p className="text-gray-600">
                  It depends on your monthly ad budget and business goals. Get a free audit 
                  and we&apos;ll recommend the best package for your needs.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">
                  What&apos;s included in the management fee?
                </h3>
                <p className="text-gray-600">
                  All packages include campaign setup, ongoing optimization, reporting, 
                  and support. The ad budget is separate from our management fee.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">
                  Can I upgrade or downgrade my package?
                </h3>
                <p className="text-gray-600">
                  Yes! As your business grows or your needs change, you can easily switch 
                  between packages.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">
                  How long before I see results?
                </h3>
                <p className="text-gray-600">
                  Most clients see initial results within 30-60 days. However, optimal 
                  performance typically develops over 3-6 months of continuous optimization.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
