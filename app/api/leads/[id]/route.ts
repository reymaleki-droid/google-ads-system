import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Lead Detail] Missing Supabase environment variables');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id: leadId } = await context.params;

    console.log('[Lead Detail] Validating lead:', leadId);

    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, email, full_name, phone_e164, created_at')
      .eq('id', leadId)
      .single();

    if (error) {
      console.error('[Lead Detail] Lead not found:', error);
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    console.log('[Lead Detail] Lead validated:', lead.id);

    return NextResponse.json({
      ok: true,
      lead: {
        id: lead.id,
        email: lead.email,
        full_name: lead.full_name,
        phone_e164: lead.phone_e164,
        created_at: lead.created_at
      }
    });
  } catch (error) {
    console.error('[Lead Detail] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
