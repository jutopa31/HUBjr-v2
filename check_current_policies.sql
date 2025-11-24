-- Check what policies are currently active on resident_profiles

SELECT
  policyname,
  cmd,
  permissive,
  qual as "using_expression",
  with_check as "with_check_expression"
FROM pg_policies
WHERE tablename = 'resident_profiles'
ORDER BY policyname;
