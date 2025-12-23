/**
 * SMS Utilities for OTP Phone Verification
 * 
 * Provider-agnostic interface for sending OTP messages via SMS
 * Supports: Twilio, AWS SNS, Infobip, and Development mode
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as TwilioProvider from './sms/providers/twilio';
import * as AWSSNSProvider from './sms/providers/aws-sns';
import * as InfobipProvider from './sms/providers/infobip';
import * as MockProvider from './sms/providers/development';

const BCRYPT_ROUNDS = 10;
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

// Normalized response interface
export interface SendOTPResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  errorCode?: string; // 'invalid_phone' | 'throttled' | 'auth_failed' | 'provider_down' | 'network_error' | 'not_configured'
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

/**
 * Hash OTP using bcrypt (10 rounds)
 * @param otp - Plain text OTP
 * @returns Bcrypt hash
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
}

/**
 * Verify OTP against bcrypt hash
 * @param otp - Plain text OTP from user
 * @param hash - Stored bcrypt hash
 * @returns True if OTP matches
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/**
 * Generate SHA-256 hash of phone number for deduplication
 * @param phoneNumber - Phone number in E.164 format
 * @returns Hex-encoded SHA-256 hash
 */
export function hashPhoneNumber(phoneNumber: string): string {
  return crypto.createHash('sha256').update(phoneNumber).digest('hex');
}

/**
 * Calculate OTP expiration timestamp (5 minutes from now)
 */
export function getOTPExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Format phone number message
 * @param phoneNumber - Phone number (may contain special chars)
 * @returns Last 4 digits for display
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.slice(-4);
}

/**
 * Send OTP via SMS - Provider-agnostic interface
 * 
 * @param params - Phone number and message
 * @returns Normalized response with provider info
 * 
 * Environment Variables:
 * - SMS_PROVIDER: 'twilio_sms' | 'aws_sns' | 'infobip' | 'mock'
 * 
 * Mock (Default - Testing):
 * - No config needed, logs OTP to console
 * 
 * Twilio:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 * 
 * AWS SNS:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 * 
 * Infobip:
 * - INFOBIP_API_KEY
 * - INFOBIP_BASE_URL
 * - INFOBIP_SENDER
 */
export async function sendOtp(params: {
  phone: string;
  message: string;
}): Promise<SendOTPResult> {
  const { phone, message } = params;
  const provider = process.env.SMS_PROVIDER || 'mock';

  try {
    switch (provider) {
      case 'mock':
      case 'development': // Backwards compatibility
        return await sendViaMock(phone, message);

      case 'twilio_sms':
      case 'twilio': // Backwards compatibility
        return await sendViaTwilio(phone, message);

      case 'aws_sns':
        return await sendViaAWSSNS(phone, message);

      case 'infobip':
        return await sendViaInfobip(phone, message);

      default:
        return {
          success: false,
          provider: provider,
          error: `Unknown SMS provider: ${provider}. Valid options: mock, twilio_sms, aws_sns, infobip`,
          errorCode: 'not_configured',
        };
    }
  } catch (error: any) {
    console.error('[SMS Error]', { provider, error: error.message });
    return {
      success: false,
      provider: provider,
      error: error.message || 'Unexpected error sending SMS',
      errorCode: 'network_error',
    };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(phoneNumber: string, message: string): Promise<SendOTPResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      provider: 'twilio_sms',
      error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER',
      errorCode: 'not_configured',
    };
  }

  const result = await TwilioProvider.sendSMS(
    { accountSid, authToken, phoneNumber: fromNumber },
    phoneNumber,
    message
  );

  return {
    ...result,
    provider: 'twilio_sms',
  };
}

/**
 * Send SMS via AWS SNS
 */
async function sendViaAWSSNS(phoneNumber: string, message: string): Promise<SendOTPResult> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!accessKeyId || !secretAccessKey) {
    return {
      success: false,
      provider: 'aws_sns',
      error: 'AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION',
      errorCode: 'not_configured',
    };
  }

  const result = await AWSSNSProvider.sendSMS(
    { accessKeyId, secretAccessKey, region },
    phoneNumber,
    message
  );

  return {
    ...result,
    provider: 'aws_sns',
  };
}

/**
 * Send SMS via Infobip
 */
async function sendViaInfobip(phoneNumber: string, message: string): Promise<SendOTPResult> {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_BASE_URL || 'https://api.infobip.com';
  const sender = process.env.INFOBIP_SENDER;

  if (!apiKey || !sender) {
    return {
      success: false,
      provider: 'infobip',
      error: 'Infobip credentials not configured. Set INFOBIP_API_KEY, INFOBIP_SENDER',
      errorCode: 'not_configured',
    };
  }

  const result = await InfobipProvider.sendSMS(
    { apiKey, baseUrl, sender },
    phoneNumber,
    message
  );

  return {
    ...result,
    provider: 'infobip',
  };
}

/**
 * Mock mode (console logging for testing)
 */
async function sendViaMock(phoneNumber: string, message: string): Promise<SendOTPResult> {
  const result = await MockProvider.sendSMS(phoneNumber, message);

  return {
    ...result,
    provider: 'development',
  };
}

/**
 * Build SMS message for OTP
 * @param otp - 6-digit OTP
 * @param companyName - Company name (default: "Google Ads System")
 * @returns Formatted SMS message
 */
export function buildOTPMessage(otp: string, companyName: string = 'Google Ads System'): string {
  return `Your ${companyName} verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
}

/**
 * Validate phone number format (basic E.164 check)
 * @param phoneNumber - Phone number string
 * @returns True if valid E.164 format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number] (max 15 digits)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}
