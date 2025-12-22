import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import caseStudiesData from '@/data/case-studies.json';

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Real Results from Real Clients
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how we&apos;ve helped businesses across industries achieve exceptional 
              results with Google Ads management.
            </p>
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {caseStudiesData.map((study) => (
                <div
                  key={study.id}
                  className="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition"
                >
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {study.client}
                      </h3>
                      <span className="text-sm text-gray-500">{study.duration}</span>
                    </div>
                    <p className="text-blue-600 font-semibold">{study.industry}</p>
                    <p className="text-sm text-gray-500 mt-1">{study.budget_range}</p>
                  </div>

                  {/* Challenge */}
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">Challenge:</h4>
                    <p className="text-gray-600">{study.challenge}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-2">Solution:</h4>
                    <p className="text-gray-600">{study.solution}</p>
                  </div>

                  {/* Results */}
                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <h4 className="font-bold text-gray-900 mb-3">Results:</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {study.results.roi_increase}
                        </div>
                        <div className="text-xs text-gray-600">ROI Increase</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {study.results.cpa_reduction}
                        </div>
                        <div className="text-xs text-gray-600">CPA Reduction</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {study.results.conversion_rate}
                        </div>
                        <div className="text-xs text-gray-600">Conv. Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="border-l-4 border-blue-600 pl-4 italic text-gray-700">
                    &quot;{study.testimonial}&quot;
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
              Aggregate Results Across All Clients
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">295%</div>
                <p className="text-gray-600">Average ROI Increase</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">50%</div>
                <p className="text-gray-600">Average CPA Reduction</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">5.9%</div>
                <p className="text-gray-600">Average Conversion Rate</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">7.5</div>
                <p className="text-gray-600">Months Avg Partnership</p>
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
