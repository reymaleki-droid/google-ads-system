import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateLeadScore, LeadFormData } from '@/lib/lead-scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const data: LeadFormData = await request.json();

    // Validation
    if (!data.email || !emailRegex.test(data.email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!data.consent) {
      return NextResponse.json(
        { ok: false, error: 'Consent is required' },
        { status: 400 }
      );
    }

    if (!data.full_name || !data.phone_e164 || !data.goal_primary || 
        !data.monthly_budget_range || !data.timeline || !data.budget_currency) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate lead score and grade
    const { score, grade, recommended_package } = calculateLeadScore(data);

    // Prepare data for database
    const leadData: any = {
      full_name: data.full_name.trim(),
      email: data.email.toLowerCase().trim(),
      phone_e164: data.phone_e164,
      phone_country: data.phone_country,
      phone_calling_code: data.phone_calling_code,
      whatsapp_same_as_phone: data.whatsapp_same_as_phone,
      whatsapp_e164: data.whatsapp_e164 || null,
      whatsapp_country: data.whatsapp_country || null,
      whatsapp_calling_code: data.whatsapp_calling_code || null,
      company_name: data.company_name?.trim() || null,
      website_url: data.website_url?.trim() || null,
      industry: data.industry || null,
      industry_other: data.industry === 'Other' ? (data.industry_other?.trim() || null) : null,
      country: data.country,
      city: data.city,
      location_area: data.location_area,
      goal_primary: data.goal_primary,
      budget_currency: data.budget_currency,
      monthly_budget_range: data.monthly_budget_range,
      response_within_5_min: data.response_within_5_min,
      decision_maker: data.decision_maker,
      timeline: data.timeline,
      recommended_package,
      lead_score: score,
      lead_grade: grade,
      status: 'new',
      consent: data.consent,
      raw_answers: data,
    };

    // Insert into Supabase
    const { data: insertedLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          ok: false, 
          error: error.message || 'Failed to save lead. Please try again.',
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      lead_id: (insertedLead as any)?.id,
      lead_score: score,
      lead_grade: grade,
      recommended_package,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
