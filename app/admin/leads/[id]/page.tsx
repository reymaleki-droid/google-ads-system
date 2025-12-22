'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  company_name: string | null;
  website_url: string | null;
  industry: string | null;
  city: string | null;
  goal_primary: string;
  monthly_budget_range: string;
  response_within_5_min: boolean;
  decision_maker: boolean;
  timeline: string;
  recommended_package: string;
  lead_score: number;
  lead_grade: string;
  status: string;
  consent: boolean;
  raw_answers: any;
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return <LeadDetailContent leadId={id} />;
}

function LeadDetailContent({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLead();
  }, []);

  const fetchLead = async () => {
    const response = await fetch(`/api/admin/leads/${leadId}`);
    const data = await response.json();
    setLead(data.lead);
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchLead();
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-600">Lead not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900">{lead.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Email
                  </label>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {lead.email}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Phone
                  </label>
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {lead.phone}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    WhatsApp
                  </label>
                  {lead.whatsapp ? (
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {lead.whatsapp}
                    </a>
                  ) : (
                    <p className="text-gray-400">-</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Company Name
                  </label>
                  <p className="text-gray-900">{lead.company_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Website
                  </label>
                  {lead.website_url ? (
                    <a
                      href={lead.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {lead.website_url}
                    </a>
                  ) : (
                    <p className="text-gray-400">-</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Industry
                  </label>
                  <p className="text-gray-900">{lead.industry || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    City
                  </label>
                  <p className="text-gray-900">{lead.city || '-'}</p>
                </div>
              </div>
            </div>

            {/* Campaign Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Campaign Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Primary Goal
                  </label>
                  <p className="text-gray-900">{lead.goal_primary}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Monthly Budget Range
                  </label>
                  <p className="text-gray-900">${lead.monthly_budget_range}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Timeline
                  </label>
                  <p className="text-gray-900">{lead.timeline}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                      Decision Maker
                    </label>
                    <p className="text-gray-900">
                      {lead.decision_maker ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                      Can Respond in 5 Minutes
                    </label>
                    <p className="text-gray-900">
                      {lead.response_within_5_min ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lead Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Score</h2>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {lead.lead_score}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  Grade {lead.lead_grade}
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Recommended Package
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {lead.recommended_package}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Update Status
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Current Status
                </label>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {lead.status}
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => updateStatus('contacted')}
                  disabled={updating}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  Mark as Contacted
                </button>
                <button
                  onClick={() => updateStatus('qualified')}
                  disabled={updating}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  Mark as Qualified
                </button>
                <button
                  onClick={() => updateStatus('converted')}
                  disabled={updating}
                  className="w-full bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800 transition disabled:bg-gray-400"
                >
                  Mark as Converted
                </button>
                <button
                  onClick={() => updateStatus('unqualified')}
                  disabled={updating}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  Mark as Unqualified
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-500">Created:</span>
                  <p className="text-gray-900">
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Lead ID:</span>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {lead.id}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Consent:</span>
                  <p className="text-gray-900">{lead.consent ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
