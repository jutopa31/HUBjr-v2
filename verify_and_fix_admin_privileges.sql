-- Verify and fix admin privileges
-- This script runs with service_role privileges (SQL Editor context)

-- 1. Show all existing full_admin privileges
SELECT
  'Existing full_admin privileges:' as step,
  id,
  user_email,
  user_id,
  privilege_type,
  is_active,
  expires_at
FROM admin_privileges
WHERE privilege_type = 'full_admin';

-- 2. Get the actual user_id for julian.martin.alonso@gmail.com
SELECT
  'User ID lookup:' as step,
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'julian.martin.alonso@gmail.com';

-- 3. Update admin_privileges to link the correct user_id
-- This ensures the user_id field is populated correctly
UPDATE admin_privileges
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'julian.martin.alonso@gmail.com'
)
WHERE user_email = 'julian.martin.alonso@gmail.com'
  AND privilege_type = 'full_admin'
  AND user_id IS NULL;

-- 4. Verify the update
SELECT
  'After update:' as step,
  id,
  user_email,
  user_id,
  privilege_type,
  is_active,
  expires_at,
  CASE
    WHEN user_id IS NOT NULL THEN 'user_id is set ✓'
    ELSE 'user_id is NULL ✗'
  END as status
FROM admin_privileges
WHERE privilege_type = 'full_admin';

-- 5. Show the final verification
SELECT
  'Final check:' as step,
  ap.user_email,
  ap.user_id,
  u.email as user_email_from_auth,
  u.id as user_id_from_auth,
  CASE
    WHEN ap.user_id = u.id THEN 'Match ✓'
    ELSE 'No match ✗'
  END as id_match
FROM admin_privileges ap
LEFT JOIN auth.users u ON u.email = ap.user_email
WHERE ap.privilege_type = 'full_admin';
