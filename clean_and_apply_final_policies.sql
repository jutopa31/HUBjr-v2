-- Clean all policies and apply only the correct ones

-- Step 1: Remove ALL existing policies on resident_profiles
DROP POLICY IF EXISTS "Anyone can view active resident profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Service role access all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Users and admins delete profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Users and admins insert profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Users and admins read profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Users and admins update profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON resident_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON resident_profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users read all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users update all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users insert profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users delete profiles" ON resident_profiles;

-- Step 2: Ensure the is_full_admin() function exists and is correct
CREATE OR REPLACE FUNCTION is_full_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_privileges ap
    WHERE ap.user_id = auth.uid()
    AND ap.privilege_type = 'full_admin'
    AND ap.is_active = true
    AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_full_admin() TO authenticated;

-- Step 3: Create clean, simple policies
-- Policy 1: Service role has full access
CREATE POLICY "Service role full access" ON resident_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy 2: Users and admins can SELECT
CREATE POLICY "Select own or admin" ON resident_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_full_admin()
  );

-- Policy 3: Users and admins can INSERT
CREATE POLICY "Insert own or admin" ON resident_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR is_full_admin()
  );

-- Policy 4: Users and admins can UPDATE
CREATE POLICY "Update own or admin" ON resident_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_full_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_full_admin()
  );

-- Policy 5: Users and admins can DELETE
CREATE POLICY "Delete own or admin" ON resident_profiles
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR is_full_admin()
  );

-- Step 4: Verify the final state
SELECT
  'Final policies:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'resident_profiles'
ORDER BY policyname;
