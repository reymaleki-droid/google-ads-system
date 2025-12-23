-- Check NOT NULL constraints on leads table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check CHECK constraints
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'leads'
  AND con.contype = 'c';
