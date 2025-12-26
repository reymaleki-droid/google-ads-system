import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function GoogleAdsPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        {/* Hero Section - Above the Fold */}
        <section className="bg-white pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Eyebrow - Context Setting */}
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Google Ads Management
              </p>
              
              {/* H1 - Outcome-Driven Value Proposition */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                Reduce wasted ad spend by 40% while increasing qualified leads
              </h1>
              
              {/* Subheadline - Who + Problem */}
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
                For GCC businesses spending $2,000+ monthly who need performance-focused campaign management, not vanity metrics
              </p>
              
              {/* Primary CTA - Single Action */}
              <div className="mb-8">
                <Link
                  href="/free-audit"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
                >
                  Get Free Campaign Audit
                </Link>
              </div>
              
              {/* Trust Signals - Friction Reduction */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 pt-6 border-t border-gray-200 max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Response within 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>No long-term commitment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem → Solution Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Stop losing money on inefficient campaigns
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Most businesses waste 30-50% of their ad budget on unqualified clicks and poor targeting
              </p>
            </div>
            
            {/* Problem-Solution Grid */}
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Problems Column */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                  Common Issues
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">High cost-per-acquisition with declining lead quality</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">No clear attribution between ad spend and revenue</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">Campaign structure setup once, never optimized</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">Budget increases without proportional results improvement</span>
                  </li>
                </ul>
              </div>
              
              {/* Solutions Column */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                  Our Approach
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Aggressive negative keyword management reduces waste by 40%</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Conversion tracking setup shows exact cost-per-acquisition</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Weekly optimization cycles based on performance data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Structured campaigns designed for scale and measurement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Process Timeline */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Three-phase implementation
              </h2>
              <p className="text-lg text-gray-600">
                From audit to optimized campaigns in 30-60 days
              </p>
            </div>
            
            {/* Process Steps */}
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded flex items-center justify-center font-bold text-lg">
                    01
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Campaign Audit
                  </h3>
                  <p className="text-base text-gray-600 mb-3">
                    Deep analysis of current account structure, budget allocation, and keyword strategy to identify waste and opportunities
                  </p>
                  <p className="text-sm font-semibold text-gray-500">
                    Timeline: 3-5 business days
                  </p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded flex items-center justify-center font-bold text-lg">
                    02
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Rebuild & Launch
                  </h3>
                  <p className="text-base text-gray-600 mb-3">
                    Clean campaign structure with proper conversion tracking, audience segmentation, and strategic bidding setup
                  </p>
                  <p className="text-sm font-semibold text-gray-500">
                    Timeline: 1-2 weeks
                  </p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded flex items-center justify-center font-bold text-lg">
                    03
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Optimize & Scale
                  </h3>
                  <p className="text-base text-gray-600 mb-3">
                    Continuous testing and refinement based on performance data to reduce cost-per-acquisition and increase lead quality
                  </p>
                  <p className="text-sm font-semibold text-gray-500">
                    Timeline: Ongoing (weekly reviews)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get - Core Deliverables */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Deliverables, not activities
              </h2>
              <p className="text-lg text-gray-600">
                What you receive from ongoing management
              </p>
            </div>
            
            {/* Deliverables Grid */}
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Clean Account Structure
                  </h3>
                  <p className="text-sm text-gray-600">
                    Organized campaigns, ad groups, and keywords for efficient optimization and measurement
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Conversion Tracking Setup
                  </h3>
                  <p className="text-sm text-gray-600">
                    Proper implementation to measure actual business results, not just clicks and impressions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Waste Reduction
                  </h3>
                  <p className="text-sm text-gray-600">
                    Aggressive negative keyword lists and search query monitoring to eliminate irrelevant clicks
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Weekly Performance Reports
                  </h3>
                  <p className="text-sm text-gray-600">
                    Clear data showing cost-per-acquisition, conversion rates, and budget efficiency metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Package Selection CTA */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose your service tier
              </h2>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Transparent pricing for businesses at different growth stages
              </p>
              
              <div className="mb-8">
                <Link
                  href="/google-ads/packages"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
                >
                  View Service Packages
                </Link>
              </div>
              
              <p className="text-sm text-gray-600">
                Starting at $750/month for businesses spending $2,000-5,000 on ads
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Start with a free campaign audit
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Get a detailed analysis of your current campaigns with specific recommendations for improvement
            </p>
            
            <div className="mb-8">
              <Link
                href="/free-audit"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-900 bg-white rounded hover:bg-gray-100 transition-colors"
              >
                Request Free Audit
              </Link>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400 pt-6 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Detailed audit report emailed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>No commitment required</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
