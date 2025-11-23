-- Fix: Add admin policies to resident_profiles table
-- This allows users with full_admin privilege to manage all resident profiles

-- Policy for admins to SELECT all profiles
DROP POLICY IF EXISTS "Admin users read all profiles" ON resident_profiles;
CREATE POLICY "Admin users read all profiles" ON resident_profiles
  FOR SELECT USING (
    -- User can read their own profile
    auth.uid() = user_id
    OR
    -- OR user has full_admin privilege
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  );

-- Policy for admins to UPDATE all profiles
DROP POLICY IF EXISTS "Admin users update all profiles" ON resident_profiles;
CREATE POLICY "Admin users update all profiles" ON resident_profiles
  FOR UPDATE USING (
    -- User can update their own profile
    auth.uid() = user_id
    OR
    -- OR user has full_admin privilege
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  )
  WITH CHECK (
    -- Same conditions for check
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  );

-- Policy for admins to INSERT new profiles
DROP POLICY IF EXISTS "Admin users insert profiles" ON resident_profiles;
CREATE POLICY "Admin users insert profiles" ON resident_profiles
  FOR INSERT WITH CHECK (
    -- User can insert their own profile
    auth.uid() = user_id
    OR
    -- OR user has full_admin privilege
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  );

-- Policy for admins to DELETE profiles
DROP POLICY IF EXISTS "Admin users delete profiles" ON resident_profiles;
CREATE POLICY "Admin users delete profiles" ON resident_profiles
  FOR DELETE USING (
    -- User can delete their own profile
    auth.uid() = user_id
    OR
    -- OR user has full_admin privilege
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  );

-- Remove the old "Users manage own profile" policy since we now have separate policies
DROP POLICY IF EXISTS "Users manage own profile" ON resident_profiles;

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
