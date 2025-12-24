'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

interface BookingDetails {
  id: string;
  selected_start: string;
  selected_end: string;
  booking_timezone?: string;
  local_start_display?: string;
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
  const formatBookingTime = (booking: BookingDetails) => {
    // Use stored local_start_display if available
    if (booking.local_start_display) {
      return booking.local_start_display;
    }
    
    // Otherwise format from UTC timestamp using booking timezone
    const timezone = booking.booking_timezone || 'Asia/Dubai';
    try {
      const formatted = formatInTimeZone(
        new Date(booking.selected_start), 
        timezone, 
        'EEEE, MMMM d, yyyy \'at\' h:mm a'
      );
      return `${formatted} (Dubai time, GMT+4)`;
    } catch (error) {
      console.error('[ThankYou] Error formatting time:', error);
      return new Date(booking.selected_start).toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <main className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Status Indicator */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-900">
              {bookingId ? "Confirmed" : "Received"}
            </span>
          </div>
        </div>

        {/* Main Confirmation */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            {bookingId 
              ? "Your meeting is confirmed" 
              : "Audit request received"}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            {bookingId 
              ? "A calendar invitation has been sent to your email. We'll send a reminder 24 hours before your scheduled time." 
              : "Your request for a Google Ads audit has been received and queued for review. You'll receive a response within 24 hours."}
          </p>
          
          {/* Reference ID */}
          {bookingId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Reference ID</p>
              <p className="text-base font-mono text-gray-900 mt-1">{bookingId.slice(0, 13).toUpperCase()}</p>
            </div>
          )}
        </div>

          {/* Booking Details */}
          {bookingId && booking && (
            <div className="mb-16 bg-gray-50 border border-gray-200 rounded-lg p-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Meeting Details</h2>
              
              {loadingBooking ? (
                <div className="text-gray-600">Loading details...</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Date & Time</p>
                    <p className="text-lg font-semibold text-gray-900">{formatBookingTime(booking)}</p>
                  </div>
                  
                  {booking.meet_url && (
                    <div className="pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-3">Video Conference</p>
                      <a 
                        href={booking.meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 rounded text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        Open Google Meet
                      </a>
                    </div>
                  )}
                  
                  {booking.calendar_status === 'synced' && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Calendar invitation sent to your email</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommended Package - Contextual Information */}
          {/* Recommended Package - Contextual Information */}
          {!bookingId && (
            <div className="mb-16 border border-gray-200 rounded-lg p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommended</p>
                  <h2 className="text-2xl font-bold text-gray-900">{pkg.name}</h2>
                </div>
                <span className="inline-block px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                  {pkg.subtitle}
                </span>
              </div>
              
              <p className="text-base text-gray-600 mb-6">{pkg.description}</p>
              
              <div className="space-y-3">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="mb-16">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">What Happens Next</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base text-gray-900 font-medium mb-1">Review & Analysis</p>
                  <p className="text-sm text-gray-600">Our team reviews your submission and prepares a comprehensive audit within 24 hours.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base text-gray-900 font-medium mb-1">Personalized Recommendations</p>
                  <p className="text-sm text-gray-600">Receive a detailed report with actionable insights specific to your business objectives.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base text-gray-900 font-medium mb-1">Strategy Discussion</p>
                  <p className="text-sm text-gray-600">Schedule a consultation call to discuss implementation and next steps.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <div className="mb-8">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-gray-900 text-white text-base font-semibold rounded hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </Link>
          </div>

          {/* Secondary Link */}
          <div className="text-center">
            <Link
              href="/google-ads/packages"
              className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              View service packages
            </Link>
          </div>

          {/* Trust Signal */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Your information is secure and will not be shared</span>
            </div>
          </div>

          {/* Debug info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-400 font-mono">
              Score: {score} | Package: {packageName}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
