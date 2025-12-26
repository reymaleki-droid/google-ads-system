import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedClient } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/campaigns
 * 
 * Returns all campaigns for the authenticated customer
 * Uses RLS - only returns campaigns where customer_id = auth.uid()
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    // Create RLS-aware Supabase client
    const supabase = createAuthenticatedClient();
    
    // Fetch campaigns - RLS automatically filters by customer_id
    const { data: campaigns, error } = await supabase
      .from('google_ads_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Customer API] Error fetching campaigns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      ok: true,
      campaigns: campaigns || [],
      count: campaigns?.length || 0,
    });
    
  } catch (error: any) {
    console.error('[Customer API] Error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer/campaigns
 * 
 * Create a new campaign (placeholder for Google Ads API integration)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createAuthenticatedClient();
    
    const body = await request.json();
    const { name, budget, target_location } = body;
    
    // Validation
    if (!name || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields: name, budget' },
        { status: 400 }
      );
    }
    
    // Create campaign record
    // Note: customer_id is automatically set by RLS INSERT policy
    const { data: campaign, error } = await supabase
      .from('google_ads_campaigns')
      .insert({
        customer_id: user.id, // Explicit for clarity, but RLS enforces this
        name,
        status: 'DRAFT',
        budget_amount_micros: budget * 1000000,
        target_location: target_location || 'UAE',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Customer API] Error creating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      ok: true,
      campaign,
    });
    
  } catch (error: any) {
    console.error('[Customer API] Error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
