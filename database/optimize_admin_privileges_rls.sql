-- Optimize Admin Privileges RLS Policies
-- This script removes recursive queries and improves performance

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users read all privileges" ON admin_privileges;
DROP POLICY IF EXISTS "Admin users read audit logs" ON admin_privilege_audit;

-- Simplified RLS Policy: Users can only read their own privileges
-- This removes the recursive query that was causing timeouts
DROP POLICY IF EXISTS "Users read own privileges" ON admin_privileges;
CREATE POLICY "Users read own privileges" ON admin_privileges
  FOR SELECT USING (
    -- Match by email from JWT
    user_email = (SELECT COALESCE(auth.jwt()->>'email', ''))
  );

-- Service role still has full access (keep existing policy)
-- This policy already exists and is performant

-- Create a materialized view for faster privilege lookups (optional optimization)
-- This can be refreshed periodically for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS user_privileges_cache AS
SELECT
  user_email,
  ARRAY_AGG(privilege_type) as privilege_types
FROM admin_privileges
WHERE is_active = true
AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_email;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_privileges_cache_email
ON user_privileges_cache(user_email);

-- Function to refresh the cache
CREATE OR REPLACE FUNCTION refresh_user_privileges_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_privileges_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function to get all user privileges in a single call
-- This replaces the need for multiple has_admin_privilege calls
CREATE OR REPLACE FUNCTION get_user_privileges_fast(user_email_param TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'privileges', COALESCE(jsonb_agg(privilege_type), '[]'::jsonb),
    'hasHospitalContextAccess',
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_email = user_email_param
        AND privilege_type IN ('hospital_context_access', 'full_admin')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      )
  )
  INTO result
  FROM admin_privileges
  WHERE user_email = user_email_param
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  RETURN COALESCE(result, '{"privileges": [], "hasHospitalContextAccess": false}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION get_user_privileges_fast(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_privileges_cache() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_privileges_fast IS
'Optimized function that returns all user privileges in a single call. Returns JSON with privileges array and hasHospitalContextAccess boolean.';
