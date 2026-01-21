'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmailInput from '@/components/EmailInput';
import PhoneField from '@/components/PhoneField';
import LocationSelect from '@/components/LocationSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { freeAuditSchema, type FreeAuditFormData } from '@/lib/validation';
import { trackLeadSubmit } from '@/lib/tracking';

export default function FreeAuditPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FreeAuditFormData>({
    resolver: zodResolver(freeAuditSchema),
    defaultValues: {
      budget_currency: 'AED',
      whatsapp_same_as_phone: true,
      response_within_5_min: false,
      country: 'AE',
      city: 'DU',
      location_area: 'Dubai',
      consent: false,
    },
  });

  const currency = watch('budget_currency');
  const whatsappSame = watch('whatsapp_same_as_phone');
  const phone = watch('phone');
  const country = watch('country');
  const city = watch('city');
  const area = watch('location_area');
  const industry = watch('industry');
  const decisionMaker = watch('decision_maker');

  const industryOptions = [
    'Healthcare / Clinic',
    'Real Estate',
    'Interior Design / Fit-out',
    'Legal Services',
    'Accounting / Tax / Business Setup',
    'Automotive (Garage / Tyres / Parts)',
    'Beauty Salon / Aesthetics',
    'Dental',
    'Education / Training',
    'Restaurant / Cafe',
    'Retail Store',
    'E-commerce',
    'Logistics / Moving',
    'Cleaning Services',
    'Maintenance / Handyman / AC',
    'Construction / Contracting',
    'Travel / Tourism',
    'Insurance',
    'SaaS / Tech',
    'Other',
  ];

  // Clear industry_other when industry changes away from 'Other'
  useEffect(() => {
    if (industry !== 'Other') {
      setValue('industry_other', '');
    }
  }, [industry, setValue]);

  const budgetRanges = {
    AED: [
      { value: '<1000', label: 'Less than 1,000 AED' },
      { value: '1000-1999', label: '1,000 - 1,999 AED' },
      { value: '2000-4999', label: '2,000 - 4,999 AED' },
      { value: '5000-9999', label: '5,000 - 9,999 AED' },
      { value: '10000+', label: '10,000+ AED' },
    ],
    USD: [
      { value: '<1000', label: 'Less than $1,000' },
      { value: '1000-1999', label: '$1,000 - $1,999' },
      { value: '2000-4999', label: '$2,000 - $4,999' },
      { value: '5000-9999', label: '$5,000 - $9,999' },
      { value: '10000+', label: '$10,000+' },
    ],
  };

  const onSubmit = async (data: FreeAuditFormData) => {
    setLoading(true);

    // Parse phone number in E.164 format (e.g., +971501234567)
    // Extract country code by finding common patterns
    const parsePhoneData = (phoneE164: string) => {
      if (!phoneE164 || !phoneE164.startsWith('+')) {
        return {
          e164: phoneE164,
          country: 'AE',
          callingCode: '+971'
        };
      }

      // Common GCC country codes
      const countryMap: { [key: string]: { country: string; callingCode: string } } = {
        '+971': { country: 'AE', callingCode: '+971' }, // UAE
        '+966': { country: 'SA', callingCode: '+966' }, // Saudi Arabia
        '+974': { country: 'QA', callingCode: '+974' }, // Qatar
        '+973': { country: 'BH', callingCode: '+973' }, // Bahrain
        '+968': { country: 'OM', callingCode: '+968' }, // Oman
        '+965': { country: 'KW', callingCode: '+965' }, // Kuwait
        '+1': { country: 'US', callingCode: '+1' },     // USA/Canada
        '+44': { country: 'GB', callingCode: '+44' },   // UK
      };

      // Check for 4-digit codes first
      const code4 = phoneE164.substring(0, 4);
      if (countryMap[code4]) {
        return {
          e164: phoneE164,
          country: countryMap[code4].country,
          callingCode: countryMap[code4].callingCode
        };
      }

      // Check for 3-digit codes
      const code3 = phoneE164.substring(0, 3);
      if (countryMap[code3]) {
        return {
          e164: phoneE164,
          country: countryMap[code3].country,
          callingCode: countryMap[code3].callingCode
        };
      }

      // Check for 2-digit codes
      const code2 = phoneE164.substring(0, 2);
      if (countryMap[code2]) {
        return {
          e164: phoneE164,
          country: countryMap[code2].country,
          callingCode: countryMap[code2].callingCode
        };
      }

      // Default to UAE if no match
      return {
        e164: phoneE164,
        country: 'AE',
        callingCode: '+971'
      };
    };

    const phoneData = parsePhoneData(data.phone);
    const whatsappData = data.whatsapp_same_as_phone 
      ? phoneData 
      : parsePhoneData(data.whatsapp || data.phone);

    const payload = {
      full_name: data.full_name,
      email: data.email,
      phone_e164: phoneData.e164,
      phone_country: phoneData.country,
      phone_calling_code: phoneData.callingCode,
      whatsapp_same_as_phone: data.whatsapp_same_as_phone,
      whatsapp_e164: whatsappData.e164,
      whatsapp_country: whatsappData.country,
      whatsapp_calling_code: whatsappData.callingCode,
      company_name: '',
      website_url: '',
      industry: data.industry || '',
      industry_other: data.industry === 'Other' ? (data.industry_other || '') : '',
      country: data.country,
      city: data.city,
      location_area: data.location_area,
      goal_primary: data.goal_primary,
      budget_currency: data.budget_currency,
      monthly_budget_range: data.monthly_budget_range,
      response_within_5_min: data.response_within_5_min,
      decision_maker: data.decision_maker === 'yes',
      timeline: data.timeline,
      consent: data.consent,
      honeypot: '', // Anti-bot field (should always be empty)
      _submit_timestamp: Date.now(), // Request timing validation
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        const errorMsg = result.error || 'Failed to submit form';
        const details = result.details ? `\n\nDetails: ${result.details}` : '';
        const hint = result.hint ? `\n\nHint: ${result.hint}` : '';
        throw new Error(errorMsg + details + hint);
      }

      trackLeadSubmit({
        email: data.email,
        lead_grade: result.lead_grade,
        lead_score: result.lead_score,
        monthly_budget_range: `${data.budget_currency} ${data.monthly_budget_range}`,
      });

      // Redirect to scheduling page instead of thank-you
      router.push(`/schedule?lead_id=${result.lead_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false); // Always reset loading state
    }
  };

  const handleStep1Continue = async () => {
    const isValid = await trigger(['industry', 'industry_other', 'goal_primary', 'decision_maker', 'budget_currency', 'monthly_budget_range', 'timeline']);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const progressValue = currentStep === 1 ? 50 : 100;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Left Column - Value Proposition */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Free Google Ads Audit
                </h1>
                <p className="text-lg text-gray-600">
                  Get a professional analysis of your advertising potential in under 2 minutes.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Share Your Goals</h3>
                    <p className="text-sm text-gray-600">Tell us about your budget and timeline</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Contact Details</h3>
                    <p className="text-sm text-gray-600">Provide your information for the audit delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Receive Your Audit</h3>
                    <p className="text-sm text-gray-600">Get personalized recommendations instantly</p>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">295%</div>
                    <div className="text-xs text-gray-600">Avg ROI Increase</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">50%</div>
                    <div className="text-xs text-gray-600">Avg Cost Reduction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:col-span-3">
              {/* Progress Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">
                    Step {currentStep} of 2
                  </p>
                  <p className="text-sm font-medium text-gray-600">{progressValue}%</p>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              <Card className="shadow-2xl border-0">
                <CardHeader className="space-y-1 pb-6">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                    {currentStep === 1 ? 'Tell us about your business' : 'Your contact details'}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    {currentStep === 1
                      ? 'Help us understand your goals and budget.'
                      : 'Almost done! We need a few details to send your audit.'}
                  </CardDescription>
                </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Business Info */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    {/* Industry */}
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        id="industry"
                        {...register('industry')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        <option value="">Select your industry</option>
                        {industryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.industry && (
                        <p className="text-sm text-red-600 mt-1">{errors.industry.message}</p>
                      )}
                    </div>

                    {/* Industry Other - Conditional */}
                    {industry === 'Other' && (
                      <div>
                        <label htmlFor="industry_other" className="block text-sm font-medium text-gray-700 mb-2">
                          Specify Your Industry *
                        </label>
                        <Input
                          id="industry_other"
                          placeholder="Write your industry"
                          {...register('industry_other')}
                        />
                        {errors.industry_other && (
                          <p className="text-sm text-red-600 mt-1">{errors.industry_other.message}</p>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Primary Goal */}
                    <div>
                      <label htmlFor="goal_primary" className="block text-sm font-medium text-gray-700 mb-2">
                        What&apos;s your primary goal? *
                      </label>
                      <select
                        id="goal_primary"
                        {...register('goal_primary')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        <option value="">Select a goal</option>
                        <option value="leads">Generate More Leads</option>
                        <option value="sales">Increase Sales</option>
                        <option value="traffic">Drive Website Traffic</option>
                        <option value="brand">Build Brand Awareness</option>
                        <option value="calls">Get More Phone Calls</option>
                      </select>
                      {errors.goal_primary && (
                        <p className="text-sm text-red-600 mt-1">{errors.goal_primary.message}</p>
                      )}
                    </div>

                    {/* Decision Maker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        I am the decision-maker or have authority to approve this project *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('decision_maker', 'yes')}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            decisionMaker === 'yes'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('decision_maker', 'no')}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            decisionMaker === 'no'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          No
                        </button>
                      </div>
                      {errors.decision_maker && (
                        <p className="text-sm text-red-600 mt-1">{errors.decision_maker.message}</p>
                      )}
                    </div>

                    {/* Budget Currency Toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Preferred Currency *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('budget_currency', 'AED')}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            currency === 'AED'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          AED (د.إ)
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('budget_currency', 'USD')}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            currency === 'USD'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          USD ($)
                        </button>
                      </div>
                    </div>

                    {/* Monthly Budget */}
                    <div>
                      <label htmlFor="monthly_budget_range" className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Advertising Budget *
                      </label>
                      <select
                        id="monthly_budget_range"
                        {...register('monthly_budget_range')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges[currency].map((range) => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Your planned monthly ad spend on Google Ads</p>
                      {errors.monthly_budget_range && (
                        <p className="text-sm text-red-600 mt-1">{errors.monthly_budget_range.message}</p>
                      )}
                    </div>

                    {/* Timeline */}
                    <div>
                      <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                        When do you want to start? *
                      </label>
                      <select
                        id="timeline"
                        {...register('timeline')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      >
                        <option value="">Select timeline</option>
                        <option value="immediately">Immediately</option>
                        <option value="1-2-weeks">Within 1-2 weeks</option>
                        <option value="1-month">Within 1 month</option>
                        <option value="3-months">Within 3 months</option>
                        <option value="just-exploring">Just exploring options</option>
                      </select>
                      {errors.timeline && (
                        <p className="text-sm text-red-600 mt-1">{errors.timeline.message}</p>
                      )}
                    </div>

                    <Separator />

                    {/* Response Time */}
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('response_within_5_min')}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          I can respond within 5 minutes if contacted today
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Info */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        id="full_name"
                        placeholder="John Doe"
                        {...register('full_name')}
                      />
                      {errors.full_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                      )}
                    </div>

                    {/* Email with Autocomplete */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <EmailInput
                        value={email}
                        onChange={(val) => {
                          setEmail(val);
                          setValue('email', val);
                        }}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone with Flags */}
                    <PhoneField
                      value={phone || ''}
                      onChange={(val) => setValue('phone', val)}
                      defaultCountry="ae"
                      label="Phone Number"
                      required
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                    )}

                    {/* WhatsApp Toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Is your WhatsApp on the same number?
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('whatsapp_same_as_phone', true)}
                          className={`flex-1 px-4 py-2 rounded-md border font-medium transition-all ${
                            whatsappSame
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('whatsapp_same_as_phone', false)}
                          className={`flex-1 px-4 py-2 rounded-md border font-medium transition-all ${
                            !whatsappSame
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Number (if different) */}
                    {!whatsappSame && (
                      <PhoneField
                        value={watch('whatsapp') || ''}
                        onChange={(val) => setValue('whatsapp', val)}
                        defaultCountry="ae"
                        label="WhatsApp Number"
                        required
                        id="whatsapp"
                      />
                    )}

                    <Separator />

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Location *
                      </label>
                      <LocationSelect
                        country={country}
                        city={city}
                        area={area}
                        onCountryChange={(val) => setValue('country', val)}
                        onCityChange={(val) => setValue('city', val)}
                        onAreaChange={(val) => setValue('location_area', val)}
                      />
                    </div>

                    <Separator />

                    {/* Consent */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('consent')}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          I agree to be contacted by email, phone, or WhatsApp for the free audit and related services. *
                        </span>
                      </label>
                      {errors.consent && (
                        <p className="text-sm text-red-600 mt-1">{errors.consent.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {currentStep === 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep === 1 ? (
                    <Button
                      type="button"
                      onClick={handleStep1Continue}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Continue to Contact Info
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {loading ? 'Submitting...' : 'Get My Free Audit'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
            </div>
          </div>

          {/* Mobile Sticky Footer */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={handleStep1Continue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
              >
                Continue to Contact Info
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-6"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-6"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile spacer */}
          <div className="lg:hidden h-24" />
        </div>
      </main>
      <Footer />
    </>
  );
}
