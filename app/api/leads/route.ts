import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateLeadScore, LeadFormData } from '@/lib/lead-scoring';
import { rateLimit, validateEmailFormat, validatePhoneE164, validateHoneypot } from '@/lib/rate-limit';
import { extractAttributionData, saveAttributionEvent, enqueueConversionEvent, generateSessionId } from '@/lib/attribution';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting: 5 requests per minute
const leadRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  console.log('LEAD_SUBMIT_START', { requestId, timestamp: new Date().toISOString() });
  
  // Apply rate limiting
  const rateLimitResponse = leadRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service_role to bypass RLS

    // DIAGNOSTIC LOGGING - Check which key is actually being used
    console.log('═══════════════════════════════════════════════════════');
    console.log('[DIAGNOSTIC] Supabase Key Check:');
    console.log('  Key Type:', supabaseKey?.includes('service_role') ? '✅ SERVICE_ROLE (bypasses RLS)' : '❌ ANON (subject to RLS)');
    console.log('  Key First 30 chars:', supabaseKey?.substring(0, 30) + '...');
    console.log('  Key Length:', supabaseKey?.length || 0);
    console.log('  URL:', supabaseUrl);
    console.log('═══════════════════════════════════════════════════════');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Leads] Missing Supabase environment variables');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const data: LeadFormData = await request.json();
    
    // Extract session_id from payload (client should send this)
    const session_id = data.session_id || generateSessionId();

    // Anti-bot honeypot check
    if (!validateHoneypot(data.honeypot)) {
      console.warn('[Leads] Bot detected via honeypot');
      return NextResponse.json(
        { ok: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validation
    if (!data.email || !validateEmailFormat(data.email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone validation (E.164 format)
    if (!data.phone_e164 || !validatePhoneE164(data.phone_e164)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone format. Use E.164 format (+country code + number)' },
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

    // Insert into Supabase (no .select() - anon SELECT is blocked)
    const { error } = await supabase
      .from('leads')
      .insert(leadData);

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

    // Retrieve lead ID using service_role to get the inserted record
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: insertedLead } = await serviceSupabase
      .from('leads')
      .select('id')
      .eq('email', data.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const leadId = insertedLead?.id;
    
    if (!leadId) {
      console.error('Failed to retrieve lead ID after insert');
      return NextResponse.json({
        ok: true,
        lead_score: score,
        lead_grade: grade,
        recommended_package
      });
    }
    
    // STAGE 5: Capture attribution data server-side
    const attributionData = extractAttributionData(request, {
      session_id,
      request_id: requestId,
      lead_id: leadId,
    });
    
    await saveAttributionEvent(attributionData);
    
    console.log('LEAD_ATTRIBUTION_CAPTURED', {
      requestId,
      leadId,
      utm_source: attributionData.utm_source,
      utm_campaign: attributionData.utm_campaign,
      gclid: attributionData.gclid,
      fbclid: attributionData.fbclid,
    });
    
    // STAGE 5: Enqueue conversion events for ad platforms
    if (attributionData.gclid) {
      await enqueueConversionEvent({
        event_type: 'lead_created',
        lead_id: leadId,
        provider: 'google_ads',
      });
      console.log('CONVERSION_ENQUEUE', { requestId, leadId, provider: 'google_ads', event: 'lead_created' });
    }
    
    if (attributionData.fbclid) {
      await enqueueConversionEvent({
        event_type: 'lead_created',
        lead_id: leadId,
        provider: 'meta_capi',
      });
      console.log('CONVERSION_ENQUEUE', { requestId, leadId, provider: 'meta_capi', event: 'lead_created' });
    }
    
    // Generate signed token for retrieval
    const { generateLeadToken } = await import('../leads/retrieve/route');
    const retrievalToken = generateLeadToken(leadId);
    
    const duration_ms = Date.now() - requestStartTime;
    console.log('LEAD_SUBMIT_SUCCESS', { requestId, leadId, duration_ms });

    return NextResponse.json({
      ok: true,
      lead_id: leadId,
      lead_score: score,
      lead_grade: grade,
      recommended_package,
      retrieval_token: retrievalToken,
      retrieval_url: `/api/leads/retrieve?token=${retrievalToken}`
    });
  } catch (error) {
    console.error('LEAD_SUBMIT_ERROR', { requestId, error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
