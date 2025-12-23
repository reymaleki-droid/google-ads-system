/**
 * OTP Modal Component
 * 
 * Handles 10 UI states for phone verification flow:
 * 1. Trigger (hidden modal, shown after lead submission)
 * 2. Sending (loading state while sending OTP)
 * 3. Sent (OTP sent successfully, input ready)
 * 4. Verifying (loading state while verifying OTP)
 * 5. Success (verification complete)
 * 6. Wrong Code (invalid OTP with retry)
 * 7. Expired (OTP expired, resend required)
 * 8. Locked (max attempts exceeded)
 * 9. Rate Limited (too many requests)
 * 10. Delayed (resend cooldown)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type OTPState = 
  | 'hidden'
  | 'sending'
  | 'sent'
  | 'verifying'
  | 'success'
  | 'wrong-code'
  | 'expired'
  | 'locked'
  | 'rate-limited'
  | 'delayed';

interface OTPModalProps {
  leadId: string;
  phoneNumber: string;
  onSuccess: () => void;
  onSkip?: () => void;
}

export default function OTPModal({ leadId, phoneNumber, onSuccess, onSkip }: OTPModalProps) {
  console.log('[OTPModal] Component rendered with:', { leadId, phoneNumber });
  const [state, setState] = useState<OTPState>('sending');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [resetIn, setResetIn] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [actualPhone, setActualPhone] = useState(phoneNumber);

  // Send OTP function (defined before useEffect)
  const sendOTP = useCallback(async () => {
    console.log('[OTPModal] sendOTP called - actualPhone:', actualPhone);
    if (!actualPhone) {
      console.log('[OTPModal] No phone number - aborting sendOTP');
      return;
    }

    setState('sending');
    setOtp('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, phoneNumber: actualPhone }),
      });

      const data = await response.json();
      console.log('[OTPModal] OTP send response:', data);

      if (!response.ok) {
        if (response.status === 429) {
          setState('rate-limited');
          setResetIn(data.resetIn || 60);
        } else {
          throw new Error(data.error || 'Failed to send OTP');
        }
        return;
      }

      if (data.alreadyVerified) {
        setState('success');
        setTimeout(() => onSuccess(), 1500);
        return;
      }

      setVerificationId(data.verificationId);
      setPhoneDisplay(data.phoneDisplay || '');
      setState('sent');
      setResendCooldown(30); // 30 second cooldown before resend

    } catch (error: any) {
      console.error('[OTPModal] Send OTP error:', error);
      alert('Failed to send verification code. Please try again.');
      setState('sent');
    }
  }, [actualPhone, leadId, onSuccess]);

  // Auto-trigger OTP send when component mounts
  useEffect(() => {
    console.log('[OTPModal] Mount effect - checking if should send OTP');
    console.log('[OTPModal] actualPhone:', actualPhone);
    console.log('[OTPModal] leadId:', leadId);
    if (actualPhone && leadId) {
      console.log('[OTPModal] Triggering sendOTP on mount');
      sendOTP();
    } else {
      console.log('[OTPModal] NOT sending OTP - missing phone or leadId');
    }
  }, [sendOTP, actualPhone, leadId]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Verify OTP
  const verifyOTP = async () => {
    if (!verificationId || otp.length !== 6) return;

    setState('verifying');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 410) {
          // Expired
          setState('expired');
        } else if (response.status === 429) {
          // Locked (max attempts)
          setState('locked');
        } else if (response.status === 401) {
          // Wrong code
          setState('wrong-code');
          setRemainingAttempts(data.remainingAttempts || 0);
          setOtp('');
        } else {
          throw new Error(data.error || 'Verification failed');
        }
        return;
      }

      // Success
      setState('success');
      setTimeout(() => onSuccess(), 1500);

    } catch (error: any) {
      console.error('Verify OTP error:', error);
      alert('Verification failed. Please try again.');
      setState('sent');
    }
  };

  // Handle OTP input
  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);

    // Auto-verify when 6 digits entered
    if (digits.length === 6) {
      setTimeout(() => verifyOTP(), 100);
    }
  };

  // Resend OTP
  const handleResend = () => {
    if (resendCooldown > 0) {
      setState('delayed');
      return;
    }
    sendOTP();
  };

  // Skip verification (if allowed)
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        
        {/* State: Sending */}
        {state === 'sending' && (
          <>
            <h2 className="text-xl font-semibold mb-4">Sending Verification Code</h2>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center text-gray-600">Sending code to {phoneDisplay || phoneNumber}...</p>
          </>
        )}

        {/* State: Sent */}
        {state === 'sent' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Verify Your Phone</h2>
            <p className="text-gray-600 mb-4">
              Enter the 6-digit code sent to {phoneDisplay || phoneNumber}
            </p>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && otp.length === 6) {
                  verifyOTP();
                }
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest mb-4"
              autoFocus
            />
            <Button 
              onClick={verifyOTP} 
              disabled={otp.length !== 6}
              className="w-full mb-4"
            >
              Verify Code
            </Button>
            <p className="text-sm text-gray-500 mb-4">
              Didn&apos;t receive it?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </p>
            {onSkip && (
              <Button variant="outline" onClick={handleSkip} className="w-full">
                Skip for Now
              </Button>
            )}
          </>
        )}

        {/* State: Verifying */}
        {state === 'verifying' && (
          <>
            <h2 className="text-xl font-semibold mb-4">Verifying Code</h2>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center text-gray-600">Checking your code...</p>
          </>
        )}

        {/* State: Success */}
        {state === 'success' && (
          <>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Phone Verified!</h2>
              <p className="text-gray-600">You&apos;ll be redirected to booking selection...</p>
            </div>
          </>
        )}

        {/* State: Wrong Code */}
        {state === 'wrong-code' && (
          <>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Incorrect Code</h2>
            <p className="text-gray-600 mb-4">
              The code you entered is incorrect. {remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : ''}
            </p>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-widest mb-4"
              autoFocus
            />
            <Button onClick={() => setState('sent')} className="w-full">
              Try Again
            </Button>
          </>
        )}

        {/* State: Expired */}
        {state === 'expired' && (
          <>
            <h2 className="text-xl font-semibold mb-2 text-orange-600">Code Expired</h2>
            <p className="text-gray-600 mb-4">
              Your verification code has expired. Request a new code to continue.
            </p>
            <Button onClick={handleResend} className="w-full">
              Send New Code
            </Button>
          </>
        )}

        {/* State: Locked */}
        {state === 'locked' && (
          <>
            <h2 className="text-xl font-semibold mb-2 text-red-600">Too Many Attempts</h2>
            <p className="text-gray-600 mb-4">
              You&apos;ve exceeded the maximum number of verification attempts. Please request a new code.
            </p>
            <Button onClick={handleResend} className="w-full">
              Send New Code
            </Button>
          </>
        )}

        {/* State: Rate Limited */}
        {state === 'rate-limited' && (
          <>
            <h2 className="text-xl font-semibold mb-2 text-orange-600">Please Wait</h2>
            <p className="text-gray-600 mb-4">
              Too many verification requests. Please wait {resetIn} seconds before trying again.
            </p>
            <Button disabled className="w-full">
              Wait {resetIn}s
            </Button>
          </>
        )}

        {/* State: Delayed */}
        {state === 'delayed' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Resend Cooldown</h2>
            <p className="text-gray-600 mb-4">
              Please wait {resendCooldown} seconds before requesting a new code.
            </p>
            <Button onClick={() => setState('sent')} variant="outline" className="w-full">
              Back to Verification
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
