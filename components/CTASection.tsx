import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="bg-blue-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Grow Your Business with Google Ads?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Get a free audit and discover how we can optimize your campaigns
        </p>
        <Link
          href="/free-audit"
          className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
        >
          Get Your Free Audit Now
        </Link>
      </div>
    </section>
  );
}
