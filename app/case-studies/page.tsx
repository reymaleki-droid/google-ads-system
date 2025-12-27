import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import caseStudiesData from '@/data/case-studies.json';

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="living-hero bg-white py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              295% average ROI increase across 6 industries
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Measured improvements in 30-90 days for businesses spending $1,500-$12,000/month on Google Ads
            </p>
            <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>6 case studies</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>4-12 month partnerships</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>$2.1M+ managed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies Grid */}
      <section className="py-20 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Representative outcomes</h2>
              <p className="text-base text-gray-600">Results measured over multi-month partnerships</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudiesData.map((study) => (
                <Card key={study.id} className="living-card shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 bg-white">
                  {/* Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl font-bold">{study.client}</CardTitle>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">{study.duration}</span>
                    </div>
                    <CardDescription className="text-base">
                      <span className="text-gray-900 font-semibold">{study.industry}</span>
                      <span className="text-gray-500 text-sm block mt-1">{study.budget_range}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Challenge */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Challenge</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{study.challenge}</p>
                    </div>

                    {/* Solution */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Solution</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{study.solution}</p>
                    </div>

                    {/* Results */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Results</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="living-metric text-xl font-bold text-gray-900">
                            {study.results.roi_increase}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">ROI</div>
                        </div>
                        <div>
                          <div className="living-metric text-xl font-bold text-gray-900">
                            {study.results.cpa_reduction}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">CPA ↓</div>
                        </div>
                        <div>
                          <div className="living-metric text-xl font-bold text-gray-900">
                            {study.results.conversion_rate}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Conv</div>
                        </div>
                      </div>
                    </div>

                    {/* Testimonial */}
                    <div className="border-l-2 border-gray-300 pl-4 text-sm italic text-gray-700">
                      &quot;{study.testimonial}&quot;
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 md:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Aggregate performance metrics
            </h2>
            <p className="text-base text-gray-600 mb-12 max-w-2xl mx-auto">
              Combined results across all client partnerships
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="living-metric text-5xl font-bold text-gray-900 mb-2">295</div>
                <p className="text-sm text-gray-600">Average ROI Increase (%)</p>
              </div>
              <div>
                <div className="living-metric text-5xl font-bold text-gray-900 mb-2">50</div>
                <p className="text-sm text-gray-600">Average CPA Reduction (%)</p>
              </div>
              <div>
                <div className="living-metric text-5xl font-bold text-gray-900 mb-2">5.9</div>
                <p className="text-sm text-gray-600">Average Conversion Rate (%)</p>
              </div>
              <div>
                <div className="living-metric text-5xl font-bold text-gray-900 mb-2">7.5</div>
                <p className="text-sm text-gray-600">Average Partnership (months)</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-8 max-w-2xl mx-auto">
              Results measured over 4-12 month partnerships with $1,500-$12,000 monthly budgets. 
              Performance varies by industry, market conditions, and campaign objectives.
            </p>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
