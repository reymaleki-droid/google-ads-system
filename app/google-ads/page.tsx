import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import Link from 'next/link';

export default function GoogleAdsPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Professional Google Ads Management Services
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Partner with experts who know how to drive results through strategic Google Ads campaigns. 
                We handle everything from setup to scaling.
              </p>
              <Link
                href="/free-audit"
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
              >
                Get Your Free Audit
              </Link>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              What We Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Campaign Strategy</h3>
                <p className="text-gray-600">
                  Custom strategy development based on your business goals, target audience, and budget.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Keyword Research</h3>
                <p className="text-gray-600">
                  In-depth keyword analysis to target the right search terms that drive qualified traffic.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Ad Creation</h3>
                <p className="text-gray-600">
                  Compelling ad copy and creative that captures attention and drives clicks.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Bid Management</h3>
                <p className="text-gray-600">
                  Strategic bidding to maximize your budget and get the best possible ROI.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">A/B Testing</h3>
                <p className="text-gray-600">
                  Continuous testing of ads, landing pages, and strategies to improve performance.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Performance Reporting</h3>
                <p className="text-gray-600">
                  Clear, actionable reports that show exactly how your campaigns are performing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Process */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Our Process
            </h2>
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Discovery & Audit</h3>
                  <p className="text-gray-600">
                    We analyze your business, competitors, and current marketing efforts to understand your needs.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Strategy Development</h3>
                  <p className="text-gray-600">
                    We create a custom Google Ads strategy tailored to your goals and budget.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Campaign Launch</h3>
                  <p className="text-gray-600">
                    We set up and launch your campaigns with optimized targeting, bidding, and ad creative.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Optimization & Growth</h3>
                  <p className="text-gray-600">
                    Continuous monitoring, testing, and optimization to improve results over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Packages Preview */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Choose the Right Package for Your Business
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Whether you&apos;re just starting out or ready to scale, we have a package that fits your needs.
            </p>
            <Link
              href="/google-ads/packages"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              View All Packages
            </Link>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
