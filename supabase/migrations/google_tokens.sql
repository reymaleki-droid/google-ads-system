-- Create google_tokens table to store OAuth refresh tokens
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  provider text DEFAULT 'google',
  refresh_token text NOT NULL,
  access_token text,
  scope text,
  token_type text,
  expiry_date bigint
);

-- Create unique constraint to ensure only one Google token per provider
CREATE UNIQUE INDEX IF NOT EXISTS google_tokens_provider_unique 
ON google_tokens (provider) 
WHERE provider = 'google';

-- Add row-level security (optional, but recommended)
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access (server-side only)
CREATE POLICY "Service role can manage google_tokens" 
ON google_tokens 
FOR ALL 
USING (true) 
WITH CHECK (true);
