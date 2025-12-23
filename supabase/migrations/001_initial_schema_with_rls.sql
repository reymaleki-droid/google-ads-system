-- Initial schema with RLS policies
-- This is the foundation schema that CI will use

-- ============================================================================
-- TABLES
-- ============================================================================

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contact Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_e164 TEXT,
  whatsapp TEXT,
  
  -- Business Information
  company_name TEXT,
  website_url TEXT,
  industry TEXT,
  city TEXT,
  
  -- Campaign Information
  goal_primary TEXT NOT NULL,
  monthly_budget_range TEXT NOT NULL,
  timeline TEXT NOT NULL,
  
  -- Qualification
  response_within_5_min BOOLEAN NOT NULL DEFAULT false,
  decision_maker BOOLEAN NOT NULL DEFAULT false,
  consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Scoring & Recommendation
  lead_score INTEGER NOT NULL,
  lead_grade TEXT NOT NULL CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  recommended_package TEXT NOT NULL CHECK (recommended_package IN ('starter', 'growth', 'scale')),
  
  -- Management
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'unqualified')),
  raw_answers JSONB
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- UTC timestamps (source of truth)
  booking_start_utc TIMESTAMPTZ NOT NULL,
  booking_end_utc TIMESTAMPTZ NOT NULL,
  
  -- Timezone context
  booking_timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
  selected_display_label TEXT,
  
  -- Calendar integration
  google_calendar_event_id TEXT,
  google_meet_link TEXT,
  
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'rescheduled'))
);

-- Google OAuth tokens table
CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  
  scope TEXT,
  user_email TEXT
);

-- Retrieval tokens table (single-use tokens)
CREATE TABLE IF NOT EXISTS retrieval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_grade ON leads(lead_grade);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_lead ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(booking_start_utc);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Google tokens indexes
CREATE INDEX IF NOT EXISTS idx_google_tokens_expires ON google_tokens(expires_at);

-- Retrieval tokens indexes
CREATE INDEX IF NOT EXISTS idx_retrieval_tokens_hash ON retrieval_tokens(token_hash) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_retrieval_tokens_expires ON retrieval_tokens(expires_at) WHERE used_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- LEADS POLICIES
-- ============================================================================

-- Anon: INSERT only (with consent check)
CREATE POLICY "anon_insert_leads_only"
  ON leads FOR INSERT TO anon
  WITH CHECK (consent = true);

-- Anon: NO SELECT (absolute block)
CREATE POLICY "anon_no_select_leads"
  ON leads FOR SELECT TO anon
  USING (false);

-- Anon: NO UPDATE (absolute block)
CREATE POLICY "anon_no_update_leads"
  ON leads FOR UPDATE TO anon
  USING (false);

-- Anon: NO DELETE (absolute block)
CREATE POLICY "anon_no_delete_leads"
  ON leads FOR DELETE TO anon
  USING (false);

-- Service role: FULL ACCESS (bypass all)
CREATE POLICY "service_role_can_manage_leads"
  ON leads FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

-- Anon: INSERT only
CREATE POLICY "anon_insert_bookings_only"
  ON bookings FOR INSERT TO anon
  WITH CHECK (true);

-- Anon: NO SELECT (absolute block)
CREATE POLICY "anon_no_select_bookings"
  ON bookings FOR SELECT TO anon
  USING (false);

-- Anon: NO UPDATE (absolute block)
CREATE POLICY "anon_no_update_bookings"
  ON bookings FOR UPDATE TO anon
  USING (false);

-- Anon: NO DELETE (absolute block)
CREATE POLICY "anon_no_delete_bookings"
  ON bookings FOR DELETE TO anon
  USING (false);

-- Service role: FULL ACCESS
CREATE POLICY "service_role_can_manage_bookings"
  ON bookings FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- GOOGLE_TOKENS POLICIES (admin-only data)
-- ============================================================================

-- Anon: NO ACCESS (absolute block)
CREATE POLICY "anon_no_access_google_tokens"
  ON google_tokens FOR ALL TO anon
  USING (false);

-- Service role: FULL ACCESS
CREATE POLICY "service_role_manage_google_tokens"
  ON google_tokens FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- RETRIEVAL_TOKENS POLICIES
-- ============================================================================

-- Anon: NO ACCESS (absolute block)
CREATE POLICY "anon_no_access_tokens"
  ON retrieval_tokens FOR ALL TO anon
  USING (false);

-- Service role: FULL ACCESS
CREATE POLICY "service_role_manage_tokens"
  ON retrieval_tokens FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- GRANTS (required for PostgREST to expose tables)
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Leads grants
GRANT INSERT, SELECT ON leads TO anon;
GRANT ALL ON leads TO authenticated, service_role;

-- Bookings grants
GRANT INSERT, SELECT ON bookings TO anon;
GRANT ALL ON bookings TO authenticated, service_role;

-- Google tokens grants (service_role only)
GRANT ALL ON google_tokens TO service_role;

-- Retrieval tokens grants (service_role only)
GRANT ALL ON retrieval_tokens TO service_role;
