-- Diagnostic script to check current RLS policies on ward_round_patients table
-- Execute this in Supabase SQL Editor to verify which policies are currently active
-- Purpose: Identify conflicting or restrictive policies that may be causing 400 errors

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ward_round_patients'
ORDER BY policyname;

-- Additional check: Verify the table has RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'ward_round_patients';

-- Check table columns to verify hospital_context exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ward_round_patients'
ORDER BY ordinal_position;
