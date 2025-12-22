'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BookingDetails {
  id: string;
  selected_start: string;
  selected_end: string;
  meet_url?: string;
  calendar_status?: string;
}

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
  const bookingId = searchParams.get('booking_id');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  useEffect(() => {
    if (bookingId) {
      setLoadingBooking(true);
      fetch(`/api/bookings/${bookingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setBooking(data.booking);
          }
        })
        .catch(err => console.error('[ThankYou] Error fetching booking:', err))
        .finally(() => setLoadingBooking(false));
    }
  }, [bookingId]);
  
  // Map package names to display format
  const packageDisplayMap = {
    'starter': 'Starter',
    'growth': 'Growth',
    'scale': 'Scale'
  };
  
  const displayPackageName = packageDisplayMap[packageName] || 'Growth';
  const pkg = packageDetails[displayPackageName as 'Starter' | 'Growth' | 'Scale'];

  // Format booking time for display
  const formatBookingTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
            {bookingId 
              ? "Your meeting has been scheduled!" 
              : "We've received your request for a free Google Ads audit."}
          </p>

          {/* Booking Details */}
          {bookingId && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8 text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Your Meeting Details
              </h2>
              
              {loadingBooking ? (
                <p className="text-gray-600">Loading booking details...</p>
              ) : booking ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Scheduled Time (Dubai/GST):</p>
                    <p className="text-lg font-semibold text-gray-900">{formatBookingTime(booking.selected_start)}</p>
                  </div>
                  
                  {booking.meet_url && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Google Meet Link:</p>
                      <a 
                        href={booking.meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/>
                        </svg>
                        Join Meeting
                      </a>
                      <p className="text-xs text-gray-500 mt-2">A calendar invite has been sent to your email</p>
                    </div>
                  )}
                  
                  {booking.calendar_status === 'synced' && (
                    <div className="flex items-center text-green-700 text-sm">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Successfully added to your Google Calendar
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Booking confirmed! Check your email for details.</p>
              )}
            </div>
          )}

          {/* Recommended Package */}
          {!bookingId && (
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
          )}

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
