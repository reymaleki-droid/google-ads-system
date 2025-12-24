import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-white py-32 md:py-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Google Ads management that reduces wasted spend and delivers qualified leads
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                For GCC-based businesses spending $2,000+ monthly on Google Ads. Stop paying for clicks that don&apos;t convert into revenue.
              </p>
              <div className="flex flex-col items-center gap-4 mb-8">
                <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-base font-semibold">
                  <Link href="/free-audit">Request audit</Link>
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Used by healthcare, real estate, and legal firms across UAE, KSA, Qatar
              </p>
            </div>
          </div>
        </section>

        {/* Qualification Section */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Is this for you?</h2>
              <p className="text-lg text-gray-600 leading-relaxed">We work with businesses serious about ROI</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* This is for you */}
              <div className="bg-slate-50 p-8 md:p-10 rounded-2xl border-2 border-slate-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">This is for you if:</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700 leading-relaxed">You run Google Ads and want qualified leads, not just traffic</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700 leading-relaxed">You operate in GCC markets (UAE, KSA, Qatar, etc.)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700 leading-relaxed">You care about cost per lead and campaign efficiency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-base text-gray-700 leading-relaxed">You&apos;re ready to commit to data-driven optimization</span>
                  </li>
                </ul>
              </div>

              {/* This is NOT for you */}
              <div className="bg-slate-900 p-8 md:p-10 rounded-2xl border-2 border-slate-700">
                <h3 className="text-2xl font-bold text-white mb-6">This is NOT for you if:</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-base text-slate-300 leading-relaxed">You&apos;re looking for cheap clicks without caring about lead quality</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-base text-slate-300 leading-relaxed">You don&apos;t control business decisions or marketing budget</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-base text-slate-300 leading-relaxed">You expect instant results without any testing phase</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-base text-slate-300 leading-relaxed">You want a set-and-forget solution with no active management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-20 md:py-24 bg-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What you actually get
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">Outcomes, not activities</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Clean account structure</h3>
                  <p className="text-base text-gray-600 leading-relaxed">Organized campaigns that make optimization easy and effective</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Waste reduction</h3>
                  <p className="text-base text-gray-600 leading-relaxed">Aggressive negative keyword management to stop wasted spend</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Conversion tracking</h3>
                  <p className="text-base text-gray-600 leading-relaxed">Proper setup to measure what actually drives business results</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Weekly optimization</h3>
                  <p className="text-base text-gray-600 leading-relaxed">Continuous improvements based on performance data</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Clear reporting</h3>
                  <p className="text-base text-gray-600 leading-relaxed">No vanity metrics—just what matters for your business</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all hover:shadow-xl bg-white">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Direct communication</h3>
                  <p className="text-base text-gray-600 leading-relaxed">No account managers—work directly with specialists</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How we work
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">A proven process from audit to results</p>
            </div>
            <div className="grid md:grid-cols-5 gap-6">
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all bg-white">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-3">01</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Audit</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Deep analysis of your current setup</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all bg-white">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-3">02</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Strategy</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Tailored plan for your market</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all bg-white">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-3">03</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Launch</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Deploy optimized campaigns</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all bg-white">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-3">04</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Optimize</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Weekly performance tuning</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-200 hover:border-blue-600 transition-all bg-white">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-3">05</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Report</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Clear metric tracking</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Packages Preview */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Choose your package
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">Transparent pricing for every stage of growth</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-xl hover:shadow-2xl transition-all bg-white border-2 border-slate-700">
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
                  <Button asChild variant="outline" className="w-full border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600" size="lg">
                    <Link href="/google-ads/packages">View details</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="shadow-2xl hover:shadow-blue-500/50 transition-all bg-white border-4 border-blue-600 scale-105 md:scale-110 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                  Most Popular
                </div>
                <CardHeader className="pb-6 pt-10">
                  <CardTitle className="text-2xl font-bold text-blue-600">Growth</CardTitle>
                  <CardDescription className="text-base pt-2">
                    For consistent lead generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-8">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Perfect for established businesses ready to scale their Google Ads investment</p>
                  </div>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg text-base font-bold" size="lg">
                    <Link href="/google-ads/packages">View details</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="shadow-xl hover:shadow-2xl transition-all bg-white border-2 border-slate-700">
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
                  <Button asChild variant="outline" className="w-full border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600" size="lg">
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
                Results from real clients
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
                  <div className="text-4xl font-bold text-blue-600 mb-2">-32% CPA</div>
                  <p className="text-base text-gray-600">Reduced cost per acquisition in 30 days</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Real Estate Agency</CardTitle>
                  <CardDescription className="text-base">Riyadh, KSA</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-4xl font-bold text-blue-600 mb-2">+185% leads</div>
                  <p className="text-base text-gray-600">Increased qualified leads in 60 days</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-all border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Legal Services</CardTitle>
                  <CardDescription className="text-base">Abu Dhabi, UAE</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-4xl font-bold text-blue-600 mb-2">-48% cost</div>
                  <p className="text-base text-gray-600">Cut wasted ad spend in 45 days</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 md:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
                Ready to see what&apos;s blocking your Google Ads performance?
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Get a detailed audit of your current campaigns with actionable recommendations
              </p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-7 text-xl font-bold shadow-2xl hover:shadow-blue-500/50 transition-all">
                <Link href="/free-audit">Get Free Google Ads Audit</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mobile Sticky CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-600 p-4 shadow-2xl z-50">
          <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-bold shadow-lg">
            <Link href="/free-audit">Get Free Google Ads Audit</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
