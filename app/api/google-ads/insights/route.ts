/**
 * Google Ads Insights API
 * 
 * Returns aggregated performance metrics for admin dashboard
 * Protected by ADMIN_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedGoogleAdsClient, getCampaigns } from '@/lib/google-ads-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adsClient = await getAuthorizedGoogleAdsClient();
    
    if (!adsClient) {
      return NextResponse.json({
        ok: false,
        error: 'Google Ads not configured',
        configured: false,
      });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days') || '30', 10);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const endDate = new Date();
    
    const dateRangeStart = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const dateRangeEnd = endDate.toISOString().split('T')[0].replace(/-/g, '');

    // Fetch campaign performance using wrapper function
    const response = await getCampaigns(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    // Aggregate metrics
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCost = 0;
    let totalConversions = 0;
    let totalConversionValue = 0;

    const campaigns: any[] = [];

    for (const row of response) {
      const campaign = row.campaign;
      const metrics = row.metrics;

      totalImpressions += parseInt(metrics.impressions || '0', 10);
      totalClicks += parseInt(metrics.clicks || '0', 10);
      totalCost += parseInt(metrics.cost_micros || '0', 10);
      totalConversions += parseFloat(metrics.conversions || '0');
      totalConversionValue += parseFloat(metrics.conversions_value || '0');

      campaigns.push({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        impressions: parseInt(metrics.impressions || '0', 10),
        clicks: parseInt(metrics.clicks || '0', 10),
        cost: parseInt(metrics.cost_micros || '0', 10) / 1_000_000, // Convert micros to currency
        conversions: parseFloat(metrics.conversions || '0'),
        conversionValue: parseFloat(metrics.conversions_value || '0'),
        averageCpc: parseInt(metrics.average_cpc || '0', 10) / 1_000_000,
      });
    }

    // Calculate aggregate metrics
    const ctr = totalClicks > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const costPerConversion = totalConversions > 0 ? totalCost / 1_000_000 / totalConversions : 0;
    const roas = totalCost > 0 ? (totalConversionValue / (totalCost / 1_000_000)) : 0;

    return NextResponse.json({
      ok: true,
      configured: true,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days: daysBack,
      },
      summary: {
        impressions: totalImpressions,
        clicks: totalClicks,
        cost: totalCost / 1_000_000, // In currency
        conversions: totalConversions,
        conversionValue: totalConversionValue,
        ctr: parseFloat(ctr.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        costPerConversion: parseFloat(costPerConversion.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
      },
      campaigns,
    });

  } catch (error: any) {
    console.error('GOOGLE_ADS_INSIGHTS_ERROR', { error: error.message });
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch insights',
      details: error.message,
    }, { status: 500 });
  }
}
