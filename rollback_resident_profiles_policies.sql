-- ROLLBACK: Restore original resident_profiles policies
-- Execute this to restore the original state

-- Remove the new admin policies
DROP POLICY IF EXISTS "Admin users read all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users update all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users insert profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users delete profiles" ON resident_profiles;

-- Restore the original simple policy
DROP POLICY IF EXISTS "Users manage own profile" ON resident_profiles;
CREATE POLICY "Users manage own profile" ON resident_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Keep the service role policy
DROP POLICY IF EXISTS "Service role access all profiles" ON resident_profiles;
CREATE POLICY "Service role access all profiles" ON resident_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'resident_profiles'
ORDER BY policyname;
