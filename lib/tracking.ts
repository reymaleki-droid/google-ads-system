// Tracking events helper for analytics
// Fire custom events that can be picked up by Google Tag Manager, Meta Pixel, etc.

export function trackLeadSubmit(data: {
  email: string;
  lead_grade: string;
  lead_score: number;
  monthly_budget_range: string;
}) {
  if (typeof window === 'undefined') return;

  // Fire custom event
  window.dispatchEvent(
    new CustomEvent('lead_submit', { detail: data })
  );

  // Push to dataLayer if available (for GTM)
  if ('dataLayer' in window) {
    (window as any).dataLayer?.push({
      event: 'lead_submit',
      ...data,
    });
  }
}

export function trackPhoneClick(phoneNumber: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('phone_click', { detail: { phone: phoneNumber } })
  );

  if ('dataLayer' in window) {
    (window as any).dataLayer?.push({
      event: 'phone_click',
      phone: phoneNumber,
    });
  }
}

export function trackWhatsAppClick(phoneNumber: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('whatsapp_click', { detail: { phone: phoneNumber } })
  );

  if ('dataLayer' in window) {
    (window as any).dataLayer?.push({
      event: 'whatsapp_click',
      phone: phoneNumber,
    });
  }
}
