'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface TimeSlot {
  startUtcIso: string; // UTC ISO timestamp
  endUtcIso: string; // UTC ISO timestamp
  timezone: string; // IANA timezone (e.g., "Asia/Dubai")
  displayLabel: string; // Human-readable label in timezone
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get('lead_id');

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadValid, setLeadValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!leadId) {
      setLoading(false);
      setLeadValid(false);
      return;
    }

    // Validate lead exists
    validateLead();
  }, [leadId]);

  const validateLead = async () => {
    try {
      console.log('[Schedule] Validating lead_id:', leadId);
      const response = await fetch(`/api/leads/${leadId}`);
      const data = await response.json();
      
      if (!data.ok) {
        console.error('[Schedule] Invalid lead_id');
        setLeadValid(false);
        setLoading(false);
        return;
      }
      
      console.log('[Schedule] Lead validated successfully');
      setLeadValid(true);
      fetchSlots();
    } catch (err) {
      console.error('[Schedule] Error validating lead:', err);
      setLeadValid(false);
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Schedule] Fetching slots...');
      const response = await fetch('/api/slots');
      const data = await response.json();
      console.log('[Schedule] Slots response:', data);

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch available slots');
      }

      setSlots(data.slots);
      console.log('[Schedule] Loaded', data.slots.length, 'slots');
    } catch (err) {
      console.error('[Schedule] Error fetching slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available times');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !leadId) {
      console.log('[Schedule] Cannot confirm - missing selectedSlot or leadId:', { selectedSlot, leadId });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log('[Schedule] ===== BOOKING SUBMISSION =====');
      console.log('[Schedule] Lead ID:', leadId);
      console.log('[Schedule] Start UTC:', selectedSlot.startUtcIso);
      console.log('[Schedule] End UTC:', selectedSlot.endUtcIso);
      console.log('[Schedule] Timezone:', selectedSlot.timezone);
      console.log('[Schedule] Display Label:', selectedSlot.displayLabel);
      console.log('[Schedule] =====================================');

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          booking_start_utc: selectedSlot.startUtcIso,
          booking_end_utc: selectedSlot.endUtcIso,
          booking_timezone: selectedSlot.timezone,
          selected_display_label: selectedSlot.displayLabel,
        }),
      });

      const data = await response.json();
      console.log('[Schedule] Booking response:', data);

      if (!data.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Redirect to thank you page with booking ID
      console.log('[Schedule] Redirecting to thank-you page...');
      router.push(`/thank-you?booking_id=${data.booking_id}`);
    } catch (err) {
      console.error('[Schedule] Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm booking');
      setSubmitting(false);
    }
  };

  // Missing or invalid lead_id
  if (!leadId || leadValid === false) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {!leadId ? 'Missing Information' : 'Invalid Link'}
                </CardTitle>
                <CardDescription className="text-base">
                  {!leadId 
                    ? "We couldn't find your submission. Please complete the audit form first."
                    : "This scheduling link is not valid or has expired. Please submit the audit form again."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/free-audit">Go to Audit Form</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Select the earliest available time
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Choose a 15-minute time slot for your Google Ads audit call
            </p>
          </div>

          {loading && (
            <Card className="shadow-xl">
              <CardContent className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
                <p className="text-base text-gray-600">Loading available times...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="shadow-xl border-2 border-red-200 bg-red-50 mb-6">
              <CardContent className="py-6">
                <p className="text-base text-red-700 font-medium">{error}</p>
                <Button
                  onClick={fetchSlots}
                  variant="outline"
                  className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && slots.length === 0 && (
            <Card className="shadow-xl">
              <CardContent className="py-12 text-center">
                <p className="text-lg text-gray-700 mb-4">
                  No available time slots at the moment. Please contact us directly.
                </p>
                <Button asChild variant="outline">
                  <Link href="/">Go Home</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && slots.length > 0 && (
            <>
              <Card className="shadow-xl mb-8">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Available Times</CardTitle>
                  <CardDescription className="text-base">
                    All times are in Dubai timezone (GST)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.startUtcIso}
                        onClick={() => {
                          console.log('[Schedule] Slot clicked:', slot);
                          setSelectedSlot(slot);
                        }}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${
                            selectedSlot?.startUtcIso === slot.startUtcIso
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                          }
                        `}
                      >
                        <div className="font-semibold text-base text-gray-900">
                          {slot.displayLabel}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">15 minutes</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedSlot || submitting}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></span>
                      Confirming...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>

              {selectedSlot && (
                <p className="text-center text-base text-gray-600 mt-6">
                  Selected: <span className="font-semibold">{selectedSlot.displayLabel}</span> <span className="text-sm text-gray-500">({selectedSlot.timezone})</span>
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
