-- Common SQL queries for managing your leads in Supabase

-- ============================================
-- ANALYTICS QUERIES
-- ============================================

-- Get lead count by grade
SELECT 
  lead_grade,
  COUNT(*) as count,
  ROUND(AVG(lead_score), 2) as avg_score
FROM leads
GROUP BY lead_grade
ORDER BY lead_grade;

-- Get lead count by status
SELECT 
  status,
  COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'qualified' THEN 3
    WHEN 'converted' THEN 4
    WHEN 'unqualified' THEN 5
  END;

-- Get leads by date (last 30 days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as leads,
  COUNT(*) FILTER (WHERE lead_grade = 'A') as grade_a,
  COUNT(*) FILTER (WHERE lead_grade = 'B') as grade_b
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Get conversion rate by grade
SELECT 
  lead_grade,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / COUNT(*), 2) as conversion_rate
FROM leads
GROUP BY lead_grade
ORDER BY lead_grade;

-- Get leads by budget range
SELECT 
  monthly_budget_range,
  COUNT(*) as count,
  ROUND(AVG(lead_score), 2) as avg_score
FROM leads
GROUP BY monthly_budget_range
ORDER BY count DESC;

-- Get top industries
SELECT 
  industry,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'converted') as converted
FROM leads
WHERE industry IS NOT NULL
GROUP BY industry
ORDER BY count DESC
LIMIT 10;

-- ============================================
-- LEAD MANAGEMENT
-- ============================================

-- Find all high-value leads (Grade A) that are still new
SELECT 
  id,
  full_name,
  email,
  phone,
  company_name,
  monthly_budget_range,
  lead_score,
  created_at
FROM leads
WHERE lead_grade = 'A' 
  AND status = 'new'
ORDER BY created_at DESC;

-- Find leads that need follow-up (contacted but not qualified)
SELECT 
  id,
  full_name,
  email,
  phone,
  company_name,
  created_at,
  DATE_PART('day', NOW() - created_at) as days_since_contact
FROM leads
WHERE status = 'contacted'
  AND created_at < NOW() - INTERVAL '3 days'
ORDER BY created_at ASC;

-- Find decision makers with high budgets
SELECT 
  full_name,
  email,
  phone,
  company_name,
  monthly_budget_range,
  lead_score
FROM leads
WHERE decision_maker = true
  AND monthly_budget_range IN ('5000-9999', '10000+')
  AND status NOT IN ('converted', 'unqualified')
ORDER BY lead_score DESC;

-- ============================================
-- DATA CLEANUP
-- ============================================

-- Find duplicate emails
SELECT 
  email,
  COUNT(*) as count
FROM leads
GROUP BY email
HAVING COUNT(*) > 1;

-- Find leads without phone numbers (shouldn't happen with validation)
SELECT *
FROM leads
WHERE phone IS NULL OR phone = '';

-- ============================================
-- PERFORMANCE TRACKING
-- ============================================

-- Calculate average time to conversion
SELECT 
  lead_grade,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (
      (SELECT MAX(created_at) FROM leads l2 WHERE l2.id = l1.id) - l1.created_at
    )) / 86400
  ), 1) as avg_days_to_convert
FROM leads l1
WHERE status = 'converted'
GROUP BY lead_grade;

-- Get lead source performance (if you add a source field)
-- SELECT 
--   source,
--   COUNT(*) as total_leads,
--   COUNT(*) FILTER (WHERE status = 'converted') as conversions,
--   ROUND(AVG(lead_score), 2) as avg_score
-- FROM leads
-- GROUP BY source
-- ORDER BY conversions DESC;

-- ============================================
-- EXPORT DATA
-- ============================================

-- Export all Grade A leads for email campaign
SELECT 
  email,
  full_name,
  company_name,
  monthly_budget_range
FROM leads
WHERE lead_grade = 'A'
  AND status NOT IN ('converted', 'unqualified')
ORDER BY lead_score DESC;

-- Export converted leads for case study outreach
SELECT 
  full_name,
  email,
  company_name,
  industry,
  monthly_budget_range,
  created_at
FROM leads
WHERE status = 'converted'
ORDER BY created_at DESC;

-- ============================================
-- MAINTENANCE
-- ============================================

-- Archive old unqualified leads (older than 90 days)
-- Note: Consider backing up before running
-- UPDATE leads
-- SET status = 'archived'
-- WHERE status = 'unqualified'
--   AND created_at < NOW() - INTERVAL '90 days';

-- Delete test leads (development only!)
-- DELETE FROM leads
-- WHERE email LIKE '%@test.com'
--   OR email LIKE '%@example.com';

-- ============================================
-- SCORING INSIGHTS
-- ============================================

-- Analyze which factors contribute most to conversions
SELECT 
  CASE 
    WHEN monthly_budget_range IN ('5000-9999', '10000+') THEN 'High Budget'
    ELSE 'Lower Budget'
  END as budget_segment,
  decision_maker,
  response_within_5_min,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / COUNT(*), 2) as conversion_rate
FROM leads
GROUP BY 
  CASE 
    WHEN monthly_budget_range IN ('5000-9999', '10000+') THEN 'High Budget'
    ELSE 'Lower Budget'
  END,
  decision_maker,
  response_within_5_min
ORDER BY conversion_rate DESC;

-- Find optimal lead score threshold
SELECT 
  CASE 
    WHEN lead_score >= 80 THEN '80+'
    WHEN lead_score >= 70 THEN '70-79'
    WHEN lead_score >= 60 THEN '60-69'
    WHEN lead_score >= 50 THEN '50-59'
    ELSE 'Below 50'
  END as score_range,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as conversions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / COUNT(*), 2) as conversion_rate
FROM leads
GROUP BY 
  CASE 
    WHEN lead_score >= 80 THEN '80+'
    WHEN lead_score >= 70 THEN '70-79'
    WHEN lead_score >= 60 THEN '60-69'
    WHEN lead_score >= 50 THEN '50-59'
    ELSE 'Below 50'
  END
ORDER BY score_range DESC;

-- ============================================
-- NOTES
-- ============================================

/*
To run these queries:
1. Go to your Supabase dashboard
2. Click "SQL Editor"
3. Paste the query you want to run
4. Click "Run"

Tips:
- Always test queries on a small dataset first
- Use SELECT before UPDATE/DELETE to verify
- Export important data before making changes
- Some queries may need adjustment based on your actual data
*/
