-- Diagnostic script to understand why is_full_admin() returns false

-- 1. Check what is the current authenticated user
SELECT
  auth.uid() as "current_user_id",
  (SELECT email FROM auth.users WHERE id = auth.uid()) as "current_user_email";

-- 2. Check what privileges exist in admin_privileges table
SELECT
  id,
  user_email,
  user_id,
  privilege_type,
  is_active,
  expires_at,
  granted_at
FROM admin_privileges
WHERE privilege_type = 'full_admin';

-- 3. Check if there's a match by email
SELECT
  'Checking by email' as check_type,
  ap.user_email as stored_value,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_value,
  (ap.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))::text as match_result
FROM admin_privileges ap
WHERE ap.privilege_type = 'full_admin';

-- 3b. Check if there's a match by user_id
SELECT
  'Checking by user_id' as check_type,
  ap.user_id::text as stored_value,
  auth.uid()::text as current_value,
  (ap.user_id = auth.uid())::text as match_result
FROM admin_privileges ap
WHERE ap.privilege_type = 'full_admin';

-- 4. Try the exact query from is_full_admin() function
SELECT EXISTS (
  SELECT 1 FROM admin_privileges ap
  WHERE (
    (ap.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    OR
    (ap.user_id = auth.uid())
  )
  AND ap.privilege_type = 'full_admin'
  AND ap.is_active = true
  AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
) as "should_be_admin";

-- 5. Check if admin_privileges table is accessible
SELECT
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE tablename = 'admin_privileges';
