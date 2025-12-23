-- Test anon INSERT directly in SQL
SET ROLE anon;

-- Try inserting a lead as anon role
INSERT INTO leads (
  full_name,
  email,
  phone,
  goal_primary,
  monthly_budget_range,
  timeline,
  lead_score,
  lead_grade,
  recommended_package,
  consent
) VALUES (
  'SQL Test',
  'sql-test@example.com',
  '+971501234567',
  'Test',
  '1000-1999',
  'ASAP',
  50,
  'B',
  'growth',
  true
);

-- Reset role
RESET ROLE;

-- Check if insert worked
SELECT * FROM leads WHERE email = 'sql-test@example.com';

-- Cleanup
DELETE FROM leads WHERE email = 'sql-test@example.com';
