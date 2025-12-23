-- Single-use token table for secure lead retrieval
CREATE TABLE IF NOT EXISTS retrieval_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_retrieval_tokens_hash ON retrieval_tokens(token_hash) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_retrieval_tokens_expires ON retrieval_tokens(expires_at) WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE retrieval_tokens ENABLE ROW LEVEL SECURITY;

-- Block all anon access
CREATE POLICY "anon_no_access_tokens"
  ON retrieval_tokens FOR ALL TO anon
  USING (false);

-- Service role full access
CREATE POLICY "service_role_manage_tokens"
  ON retrieval_tokens FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup expired tokens (run periodically)
-- DELETE FROM retrieval_tokens WHERE expires_at < NOW() - INTERVAL '1 day';

-- Verify
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'retrieval_tokens';
