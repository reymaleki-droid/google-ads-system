import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import Link from 'next/link';

const packages = [
  {
    name: 'Starter',
    subtitle: 'Validation',
    price: 'Starting at $450/month',
    budget: '$1-2K monthly ad spend',
    timeline: 'Results in 60-90 days',
    description: 'Test Google Ads with controlled investment and clear metrics',
    features: [
      'Campaign setup & keyword research',
      'Monthly performance reporting',
      'Email support & optimization',
      'Basic conversion tracking',
    ],
    cta: 'Get Started',
    recommended: false,
    caseStudy: {
      metric: '-38%',
      label: 'CPA reduction',
      context: 'Legal services, 90 days',
    },
  },
  {
    name: 'Growth',
    subtitle: 'Optimization',
    price: 'Starting at $950/month',
    budget: '$2-5K monthly ad spend',
    timeline: 'Results in 30-60 days',
    description: 'Scale with advanced optimization and bi-weekly strategic guidance',
    features: [
      'Advanced campaign optimization',
      'Bi-weekly performance calls',
      'A/B testing & experimentation',
      'Remarketing & audience targeting',
    ],
    cta: 'Get Started',
    recommended: true,
    caseStudy: {
      metric: '-42%',
      label: 'CPA reduction',
      context: 'Healthcare, 4 months',
    },
  },
  {
    name: 'Scale',
    subtitle: 'Governance',
    price: 'Starting at $1,950/month',
    budget: '$5K+ monthly ad spend',
    timeline: 'Immediate impact',
    description: 'Multi-channel strategy with dedicated management and weekly optimization',
    features: [
      'Dedicated account manager',
      'Weekly strategic calls',
      'Multi-channel coordination',
      'Custom reporting dashboards',
    ],
    cta: 'Get Started',
    recommended: false,
    caseStudy: {
      metric: '+185%',
      label: 'Lead increase',
      context: 'Real estate, 60 days',
    },
  },
];

export default function PackagesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="living-hero bg-white py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Fixed-price Google Ads management
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Transparent packages for $1K-$5K+ monthly ad budgets with measurable results in 30-90 days
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 border-t border-gray-200 max-w-2xl mx-auto text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>No long-term contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Money-back guarantee</span>
              </div>
            </div>
          </div>
        </section>

        {/* Packages Grid */}
        <section className="fade-in-section py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose your package
              </h2>
              <p className="text-lg text-gray-600">Transparent pricing for every stage of growth</p>
            </div>
            <div className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="living-card rounded-lg border-2 border-gray-200 p-8 bg-white hover:border-gray-300 transition-all"
                >
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {pkg.name}
                      </h3>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {pkg.subtitle}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{pkg.budget}</p>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {pkg.price}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{pkg.timeline}</p>
                    <p className="text-base text-gray-600">{pkg.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5"
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
                    className={`living-button living-focus block text-center py-3 px-6 rounded-lg font-semibold transition ${
                      pkg.recommended
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'border-2 border-gray-300 text-gray-900 hover:border-gray-900 bg-white'
                    }`}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Package-Specific Outcomes */}
        <section className="fade-in-section py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Representative outcomes
              </h2>
              <p className="text-lg text-gray-600">Measured improvements by package tier</p>
            </div>
            <div className="stagger-children grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="living-card bg-gray-50 border-2 border-gray-200 rounded-lg p-8 hover:border-gray-300 transition-all"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name} Package</h3>
                    <p className="text-sm text-gray-600">{pkg.caseStudy.context}</p>
                  </div>
                  <div className="living-metric text-5xl font-bold text-gray-900 mb-2">
                    {pkg.caseStudy.metric}
                  </div>
                  <p className="text-base text-gray-600">{pkg.caseStudy.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center mt-8">
              Results measured over 30-90 day optimization periods with similar budget tiers
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="fade-in-section py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Common questions
            </h2>
            <div className="stagger-children space-y-6">
              <div className="living-card bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  How do I know which package is right for me?
                </h3>
                <p className="text-gray-600">
                  Match package to your monthly ad spend: $1-2K → Starter, $2-5K → Growth, $5K+ → Scale. Get free audit for personalized recommendation.
                </p>
              </div>
              <div className="living-card bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  What&apos;s included in the management fee?
                </h3>
                <p className="text-gray-600">
                  Campaign setup, daily optimization, reporting, and support. Ad budget is separate from management fee.
                </p>
              </div>
              <div className="living-card bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Can I upgrade or downgrade my package?
                </h3>
                <p className="text-gray-600">
                  Yes. Change packages anytime as your business grows or budget adjusts.
                </p>
              </div>
              <div className="living-card bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  How long before I see results?
                </h3>
                <p className="text-gray-600">
                  Initial results in 30-60 days. Full optimization over 3-6 months of continuous testing.
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
