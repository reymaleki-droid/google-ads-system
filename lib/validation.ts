import { z } from 'zod';

export const freeAuditSchema = z.object({
  // Step 1: Business Info
  industry: z.string().min(1, 'Please select your industry'),
  industry_other: z.string().optional(),
  goal_primary: z.string().min(1, 'Please select your primary goal'),
  decision_maker: z.enum(['yes', 'no'], {
    message: 'Please select whether you are the decision-maker',
  }),
  budget_currency: z.enum(['AED', 'USD']),
  monthly_budget_range: z.string().min(1, 'Please select your budget range'),
  response_within_5_min: z.boolean(),
  timeline: z.string().min(1, 'Please select your timeline'),
  
  // Step 2: Contact Info
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  whatsapp_same_as_phone: z.boolean(),
  whatsapp: z.string().optional(),
  
  // Location
  country: z.string().min(1, 'Please select a country'),
  city: z.string().min(1, 'Please select a state/emirate'),
  location_area: z.string().min(1, 'Please select a city'),
  
  // Consent
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms to continue',
  }),
}).refine((data) => {
  if (data.industry === 'Other' && (!data.industry_other || data.industry_other.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Please specify your industry',
  path: ['industry_other'],
});

export type FreeAuditFormData = z.infer<typeof freeAuditSchema>;
