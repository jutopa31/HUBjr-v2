-- Setup resident profiles table for main branch
-- Run this script in your Supabase SQL editor

-- Create simplified resident_profiles table
CREATE TABLE IF NOT EXISTS resident_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- Removed FK constraint to avoid auth.users dependency

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,

  -- Training Information
  training_level TEXT NOT NULL CHECK (training_level IN ('R1', 'R2', 'R3', 'R4', 'R5', 'fellow', 'attending', 'intern')),
  current_rotation TEXT DEFAULT 'Neurología General',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'graduated', 'transferred', 'suspended')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resident_profiles_user_id ON resident_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resident_profiles_training_level ON resident_profiles(training_level);
CREATE INDEX IF NOT EXISTS idx_resident_profiles_status ON resident_profiles(status);

-- Enable Row Level Security
ALTER TABLE resident_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for resident_profiles
DROP POLICY IF EXISTS "Users can view all active resident profiles" ON resident_profiles;
CREATE POLICY "Users can view all active resident profiles" ON resident_profiles
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users manage own profile" ON resident_profiles;
CREATE POLICY "Users manage own profile" ON resident_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role access all profiles" ON resident_profiles;
CREATE POLICY "Service role access all profiles" ON resident_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON resident_profiles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_resident_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_resident_profiles_updated_at ON resident_profiles;
CREATE TRIGGER tr_resident_profiles_updated_at
  BEFORE UPDATE ON resident_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_profiles_updated_at();

-- Insert sample resident data
-- NOTE: You'll need to replace the user_id values with actual user IDs from your auth.users table
-- You can get user IDs by running: SELECT id, email FROM auth.users;

INSERT INTO resident_profiles (user_id, first_name, last_name, email, training_level, current_rotation, status)
VALUES
  -- Replace these UUIDs with actual user_id values from your auth.users table
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Juan', 'Pérez', 'juan.perez@hospital.com', 'R1', 'Neurología General', 'active'),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'María', 'González', 'maria.gonzalez@hospital.com', 'R2', 'Stroke Unit', 'active'),
  ('00000000-0000-0000-0000-000000000003'::UUID, 'Carlos', 'Rodriguez', 'carlos.rodriguez@hospital.com', 'R3', 'Neurofisiología', 'active'),
  ('00000000-0000-0000-0000-000000000004'::UUID, 'Ana', 'Martínez', 'ana.martinez@hospital.com', 'R4', 'Neurocirugía', 'active'),
  ('00000000-0000-0000-0000-000000000005'::UUID, 'Luis', 'García', 'luis.garcia@hospital.com', 'R5', 'Investigación', 'active'),
  ('00000000-0000-0000-0000-000000000006'::UUID, 'Elena', 'López', 'elena.lopez@hospital.com', 'fellow', 'Epilepsia', 'active'),
  ('00000000-0000-0000-0000-000000000007'::UUID, 'Dr. Roberto', 'Fernández', 'roberto.fernandez@hospital.com', 'attending', 'Staff Neurología', 'active')
ON CONFLICT (email) DO NOTHING;

-- Function to create sample data with your actual user IDs
-- Run this after replacing the UUIDs above with real ones from your auth.users table
CREATE OR REPLACE FUNCTION create_sample_resident_profiles()
RETURNS TEXT AS $$
BEGIN
  -- This function helps you create sample data
  -- First, run: SELECT id, email FROM auth.users LIMIT 10;
  -- Then replace the UUIDs in the INSERT statement above
  RETURN 'Please update the INSERT statement with actual user IDs from auth.users table';
END;
$$ LANGUAGE plpgsql;

-- To use this script:
-- 1. Copy and run the first part (CREATE TABLE to INSERT statement)
-- 2. Get your actual user IDs: SELECT id, email FROM auth.users;
-- 3. Replace the sample UUIDs in the INSERT statement with real ones
-- 4. Run the INSERT statement again