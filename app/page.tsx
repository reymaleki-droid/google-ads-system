import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* 1. HERO - Above the fold */}
        <section className="bg-white py-24 md:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                Stop wasting ad spend on clicks that don&apos;t convert
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Google Ads management for GCC businesses spending $2,000+/month who need qualified leads, not vanity metrics
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-base font-semibold shadow-sm">
                  <Link href="/free-audit">Get free audit</Link>
                </Button>
                <Link href="/google-ads/packages" className="text-sm text-gray-600 hover:text-gray-900 underline">
                  View pricing
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 border-t border-gray-200 max-w-2xl mx-auto text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Response within 24hrs</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>No commitment required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>UAE, KSA, Qatar businesses</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PROBLEM → OUTCOME */}
        <section className="py-20 md:py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Problems */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your current situation</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">Ad spend increasing but lead quality declining</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">No clear connection between ad spend and revenue</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700">Campaign setup done once, never optimized</span>
                  </li>
                </ul>
              </div>

              {/* Outcomes */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What changes</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Same budget, 2–3x more qualified leads</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Weekly reports showing cost per acquisition</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-900 font-medium">Continuous optimization based on data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
              <p className="text-base text-gray-600">Three steps from audit to results</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all hover:shadow-sm">
                <div className="text-sm font-semibold text-gray-500 mb-3">STEP 1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Audit</h3>
                <p className="text-base text-gray-600">Deep analysis of current campaign structure and wasted spend</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all hover:shadow-sm">
                <div className="text-sm font-semibold text-gray-500 mb-3">STEP 2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Rebuild</h3>
                <p className="text-base text-gray-600">Clean campaign setup with proper tracking and targeting</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all hover:shadow-sm">
                <div className="text-sm font-semibold text-gray-500 mb-3">STEP 3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Optimize</h3>
                <p className="text-base text-gray-600">Weekly adjustments to maximize lead quality and reduce cost</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SOCIAL PROOF / What You Get */}
        <section className="py-20 md:py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">What you get</h2>
              <p className="text-base text-gray-600">Deliverables, not activities</p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Clean account structure</h3>
                  <p className="text-sm text-gray-600">Organized campaigns for easy optimization</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Waste reduction</h3>
                  <p className="text-sm text-gray-600">Aggressive negative keyword management</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Conversion tracking</h3>
                  <p className="text-sm text-gray-600">Proper setup to measure business results</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Weekly optimization</h3>
                  <p className="text-sm text-gray-600">Continuous improvements based on data</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CONVERSION BLOCK */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Start with a free audit
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Get a detailed audit of your current campaigns with actionable recommendations
              </p>
              
              <div className="mb-10">
                <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-base font-semibold shadow-sm">
                  <Link href="/free-audit">Get free audit</Link>
                </Button>
              </div>

              {/* Friction-killers */}
              <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-gray-200 text-sm text-gray-600">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Response within 24 hours</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Detailed audit report emailed</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>No commitment required</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Packages Preview */}
        <section className="py-20 md:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Choose your package
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">Transparent pricing for every stage of growth</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-all bg-white border-2 border-gray-200">
                <CardHeader className="pb-6 pt-8">
                  <CardTitle className="text-2xl font-bold">Starter</CardTitle>
                  <CardDescription className="text-base pt-2">
                    For testing and controlled growth
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-8">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Ideal for businesses starting with Google Ads or running small campaigns</p>
                  </div>
                  <Button asChild variant="outline" className="living-button w-full border-2 border-gray-300 hover:border-gray-900" size="lg">
                    <Link href="/google-ads/packages">View details</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="living-card shadow-lg hover:shadow-xl transition-all bg-white border-2 border-gray-200">
                <CardHeader className="pb-6 pt-8">
                  <CardTitle className="text-2xl font-bold">Growth</CardTitle>
                  <CardDescription className="text-base pt-2">
                    For consistent lead generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-8">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Perfect for established businesses ready to scale their Google Ads investment</p>
                  </div>
                  <Button asChild className="living-button living-focus w-full bg-gray-900 hover:bg-gray-800 text-base font-bold" size="lg">
                    <Link href="/google-ads/packages">View details</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-all bg-white border-2 border-gray-200">
                <CardHeader className="pb-6 pt-8">
                  <CardTitle className="text-2xl font-bold">Scale</CardTitle>
                  <CardDescription className="text-base pt-2">
                    For aggressive expansion
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-8">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">For businesses running multiple campaigns across different markets</p>
                  </div>
                  <Button asChild variant="outline" className="living-button w-full border-2 border-gray-300 hover:border-gray-900" size="lg">
                    <Link href="/google-ads/packages">View details</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Case Studies Preview */}
        <section id="case-studies" className="py-20 md:py-24 bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Representative outcomes
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">Measured improvements in 30-60 days</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Healthcare Clinic</CardTitle>
                  <CardDescription className="text-base">Dubai, UAE</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="living-metric text-4xl font-bold text-blue-600 mb-2">-32% CPA</div>
                  <p className="text-base text-gray-600">Reduced cost per acquisition in 30 days</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Real Estate Agency</CardTitle>
                  <CardDescription className="text-base">Riyadh, KSA</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="living-metric text-4xl font-bold text-blue-600 mb-2">+185% leads</div>
                  <p className="text-base text-gray-600">Increased qualified leads in 60 days</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Legal Services</CardTitle>
                  <CardDescription className="text-base">Abu Dhabi, UAE</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="living-metric text-4xl font-bold text-blue-600 mb-2">-48% cost</div>
                  <p className="text-base text-gray-600">Cut wasted ad spend in 45 days</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-gray-500 text-center mt-8">Results measured over 30-60 day optimization periods</p>
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-900 p-4 shadow-2xl z-50">
          <Button asChild size="lg" className="living-button living-focus w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-base font-bold shadow-lg">
            <Link href="/free-audit">Request audit</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
