import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    // Clean up old entries
    if (record && now > record.resetTime) {
      rateLimitStore.delete(ip);
    }

    const current = rateLimitStore.get(ip);

    if (!current) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null;
    }

    if (current.count >= config.maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    current.count++;
    return null;
  };
}

// Validation utilities
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

export function validatePhoneE164(phone: string): boolean {
  // E.164 format: +[country code][number]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

export function validateTimeSlot(time: string): boolean {
  // Check if time is HH:MM format
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  
  // Only allow 08:00-20:00
  if (hours < 8 || hours >= 20) return false;
  
  // Only allow 15-minute intervals
  if (minutes % 15 !== 0) return false;
  
  return true;
}

export function validateSlotDate(dateStr: string): { valid: boolean; error?: string } {
  try {
    const date = new Date(dateStr);
    const now = new Date();

    // Check if date is in the past
    if (date < now) {
      return { valid: false, error: 'Slot date cannot be in the past' };
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid date format' };
  }
}

// Anti-bot validation
export function validateHoneypot(honeypotValue: string | undefined): boolean {
  // Honeypot field should be empty (bots often fill all fields)
  return !honeypotValue || honeypotValue === '';
}

export function validateRequestTiming(timestamp: number | undefined): boolean {
  if (!timestamp) return false;
  
  const now = Date.now();
  const elapsed = now - timestamp;
  
  // Request should take at least 2 seconds (human form fill time)
  // but not more than 10 minutes (session timeout)
  return elapsed >= 2000 && elapsed <= 600000;
}
