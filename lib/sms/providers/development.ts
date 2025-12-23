/**
 * Mock SMS Provider (Local Testing)
 * Logs OTPs securely to console for development/testing
 * NO real SMS sent - perfect for local development
 */

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SendResult> {
  // Extract OTP from message for secure logging
  const otpMatch = message.match(/\b\d{6}\b/);
  const otp = otpMatch ? otpMatch[0] : 'N/A';
  
  // Mask phone number for security (show only last 4 digits)
  const maskedPhone = phoneNumber.replace(/(\+\d{1,3})\d+(\d{4})/, '$1******$2');

  console.log('');
  console.log('┌' + '─'.repeat(58) + '┐');
  console.log('│ 📱 MOCK SMS PROVIDER (Testing Mode)'.padEnd(59) + '│');
  console.log('├' + '─'.repeat(58) + '┤');
  console.log('│ To: ' + maskedPhone.padEnd(52) + '│');
  console.log('│ OTP Code: ' + otp.padEnd(46) + '│');
  console.log('│ Status: ✅ Logged (No real SMS sent)'.padEnd(59) + '│');
  console.log('└' + '─'.repeat(58) + '┘');
  console.log('');

  return {
    success: true,
    messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}
