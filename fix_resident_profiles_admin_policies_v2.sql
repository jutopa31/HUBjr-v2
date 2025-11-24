-- Fix v2: Add admin policies to resident_profiles table
-- This version is more robust and handles edge cases

-- First, let's create a helper function to check if current user is admin
-- This is more efficient than repeating the EXISTS query in each policy
CREATE OR REPLACE FUNCTION is_full_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_privileges ap
    WHERE (
      -- Check by email
      (ap.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      OR
      -- Also check by user_id if available
      (ap.user_id = auth.uid())
    )
    AND ap.privilege_type = 'full_admin'
    AND ap.is_active = true
    AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, return false
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Now drop existing policies
DROP POLICY IF EXISTS "Users manage own profile" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users read all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users update all profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users insert profiles" ON resident_profiles;
DROP POLICY IF EXISTS "Admin users delete profiles" ON resident_profiles;

-- Policy for SELECT: Users can read their own profile OR admins can read all
CREATE POLICY "Users and admins read profiles" ON resident_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR is_full_admin()
  );

-- Policy for INSERT: Users can insert their own profile OR admins can insert any
CREATE POLICY "Users and admins insert profiles" ON resident_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR is_full_admin()
  );

-- Policy for UPDATE: Users can update their own profile OR admins can update any
CREATE POLICY "Users and admins update profiles" ON resident_profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR is_full_admin()
  )
  WITH CHECK (
    auth.uid() = user_id OR is_full_admin()
  );

-- Policy for DELETE: Users can delete their own profile OR admins can delete any
CREATE POLICY "Users and admins delete profiles" ON resident_profiles
  FOR DELETE USING (
    auth.uid() = user_id OR is_full_admin()
  );

-- Keep the service role policy
DROP POLICY IF EXISTS "Service role access all profiles" ON resident_profiles;
CREATE POLICY "Service role access all profiles" ON resident_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_full_admin() TO authenticated;

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'resident_profiles'
ORDER BY policyname;

-- Test the function (should return true for julian.martin.alonso@gmail.com)
SELECT is_full_admin() as "am_i_admin";
