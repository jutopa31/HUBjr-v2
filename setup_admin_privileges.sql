-- Admin Privileges System
-- Implements user-based privilege system for hospital context access and admin functions

-- Create admin_privileges table
CREATE TABLE IF NOT EXISTS admin_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL, -- Using email for easier identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to auth user if available

  -- Privilege types
  privilege_type TEXT NOT NULL CHECK (privilege_type IN (
    'hospital_context_access', -- Can access both Posadas and Julian contexts
    'full_admin', -- Full administrative access
    'lumbar_puncture_admin', -- Admin access to lumbar puncture system
    'scale_management', -- Can manage medical scales
    'user_management' -- Can manage users
  )),

  -- Privilege details
  privilege_value JSONB DEFAULT '{}', -- Additional configuration for the privilege
  description TEXT, -- Human-readable description of the privilege

  -- Grant information
  granted_by TEXT, -- Who granted this privilege
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration

  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique privilege per user
  UNIQUE(user_email, privilege_type)
);

-- Create audit log for privilege changes
CREATE TABLE IF NOT EXISTS admin_privilege_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privilege_id UUID REFERENCES admin_privileges(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  privilege_type TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'modified', 'expired')),
  previous_value JSONB,
  new_value JSONB,
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_privileges_user_email ON admin_privileges(user_email);
CREATE INDEX IF NOT EXISTS idx_admin_privileges_type ON admin_privileges(privilege_type);
CREATE INDEX IF NOT EXISTS idx_admin_privileges_active ON admin_privileges(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_privilege_audit_user ON admin_privilege_audit(user_email);

-- Enable Row Level Security
ALTER TABLE admin_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_privilege_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_privileges
-- Service role can access all privileges
DROP POLICY IF EXISTS "Service role access all privileges" ON admin_privileges;
CREATE POLICY "Service role access all privileges" ON admin_privileges
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own privileges
DROP POLICY IF EXISTS "Users read own privileges" ON admin_privileges;
CREATE POLICY "Users read own privileges" ON admin_privileges
  FOR SELECT USING (
    user_email = (SELECT auth.email())
    OR user_id = auth.uid()
  );

-- Admin users can read all privileges
DROP POLICY IF EXISTS "Admin users read all privileges" ON admin_privileges;
CREATE POLICY "Admin users read all privileges" ON admin_privileges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  );

-- RLS Policies for admin_privilege_audit
DROP POLICY IF EXISTS "Service role access all audit logs" ON admin_privilege_audit;
CREATE POLICY "Service role access all audit logs" ON admin_privilege_audit
  FOR ALL USING (auth.role() = 'service_role');

-- Admin users can read audit logs
DROP POLICY IF EXISTS "Admin users read audit logs" ON admin_privilege_audit;
CREATE POLICY "Admin users read audit logs" ON admin_privilege_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_privileges ap
      WHERE ap.user_email = (SELECT auth.email())
      AND ap.privilege_type = 'full_admin'
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON admin_privileges TO authenticated;
GRANT SELECT ON admin_privilege_audit TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Function to check if user has privilege
CREATE OR REPLACE FUNCTION has_admin_privilege(user_email_param TEXT, privilege_type_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_privileges
    WHERE user_email = user_email_param
    AND privilege_type = privilege_type_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user privileges
CREATE OR REPLACE FUNCTION get_user_privileges(user_email_param TEXT)
RETURNS TABLE (
  privilege_type TEXT,
  privilege_value JSONB,
  description TEXT,
  granted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.privilege_type,
    ap.privilege_value,
    ap.description,
    ap.granted_at,
    ap.expires_at
  FROM admin_privileges ap
  WHERE ap.user_email = user_email_param
  AND ap.is_active = true
  AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
  ORDER BY ap.granted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant privilege with audit
CREATE OR REPLACE FUNCTION grant_admin_privilege(
  user_email_param TEXT,
  privilege_type_param TEXT,
  description_param TEXT DEFAULT NULL,
  granted_by_param TEXT DEFAULT 'system',
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  privilege_value_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  privilege_id UUID;
BEGIN
  -- Insert or update privilege
  INSERT INTO admin_privileges (
    user_email,
    privilege_type,
    description,
    granted_by,
    expires_at,
    privilege_value,
    is_active
  ) VALUES (
    user_email_param,
    privilege_type_param,
    description_param,
    granted_by_param,
    expires_at_param,
    privilege_value_param,
    true
  )
  ON CONFLICT (user_email, privilege_type)
  DO UPDATE SET
    is_active = true,
    description = EXCLUDED.description,
    granted_by = EXCLUDED.granted_by,
    expires_at = EXCLUDED.expires_at,
    privilege_value = EXCLUDED.privilege_value,
    updated_at = NOW()
  RETURNING id INTO privilege_id;

  -- Create audit log
  INSERT INTO admin_privilege_audit (
    privilege_id,
    user_email,
    privilege_type,
    action,
    new_value,
    performed_by
  ) VALUES (
    privilege_id,
    user_email_param,
    privilege_type_param,
    'granted',
    jsonb_build_object(
      'description', description_param,
      'granted_by', granted_by_param,
      'expires_at', expires_at_param,
      'privilege_value', privilege_value_param
    ),
    granted_by_param
  );

  RETURN privilege_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_admin_privileges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_admin_privileges_updated_at ON admin_privileges;
CREATE TRIGGER tr_admin_privileges_updated_at
  BEFORE UPDATE ON admin_privileges
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_privileges_updated_at();

-- Grant hospital context access to julian.martin.alonso@gmail.com
SELECT grant_admin_privilege(
  'julian.martin.alonso@gmail.com',
  'hospital_context_access',
  'Access to both Hospital Posadas and Consultorios Julian patient contexts',
  'system_setup',
  NULL, -- No expiration
  '{"hospitals": ["Posadas", "Julian"]}'::jsonb
);

-- Also grant full admin access
SELECT grant_admin_privilege(
  'julian.martin.alonso@gmail.com',
  'full_admin',
  'Full administrative access to all system functions',
  'system_setup',
  NULL, -- No expiration
  '{}'::jsonb
);

-- Verify the privileges were created
SELECT
  user_email,
  privilege_type,
  description,
  is_active,
  granted_at
FROM admin_privileges
WHERE user_email = 'julian.martin.alonso@gmail.com';