-- Simple resident profiles setup (fixed version)
-- Run this script in your Supabase SQL Editor

-- Drop table if exists (to start clean)
DROP TABLE IF EXISTS resident_profiles;

-- Create simplified resident_profiles table
CREATE TABLE resident_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  training_level TEXT NOT NULL CHECK (training_level IN ('R1', 'R2', 'R3', 'R4', 'R5', 'fellow', 'attending', 'intern')),
  current_rotation TEXT DEFAULT 'Neurología General',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'graduated', 'transferred', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_resident_profiles_user_id ON resident_profiles(user_id);
CREATE INDEX idx_resident_profiles_training_level ON resident_profiles(training_level);
CREATE INDEX idx_resident_profiles_status ON resident_profiles(status);

-- Enable Row Level Security
ALTER TABLE resident_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified)
CREATE POLICY "Anyone can view active resident profiles" ON resident_profiles
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert their own profile" ON resident_profiles
  FOR INSERT WITH CHECK (true);  -- Allow inserts for testing

CREATE POLICY "Users can update their own profile" ON resident_profiles
  FOR UPDATE USING (true);  -- Simplified for testing

-- Grant permissions
GRANT ALL ON resident_profiles TO authenticated;
GRANT ALL ON resident_profiles TO anon;

-- Insert sample data immediately
INSERT INTO resident_profiles (user_id, first_name, last_name, email, training_level, current_rotation)
VALUES
  (gen_random_uuid(), 'Juan Carlos', 'Pérez García', 'juan.perez@ejemplo.com', 'R1', 'Neurología General'),
  (gen_random_uuid(), 'María Elena', 'González López', 'maria.gonzalez@ejemplo.com', 'R2', 'Stroke Unit'),
  (gen_random_uuid(), 'Carlos Alberto', 'Rodríguez Morales', 'carlos.rodriguez@ejemplo.com', 'R3', 'Neurofisiología'),
  (gen_random_uuid(), 'Ana Sofía', 'Martínez Ruiz', 'ana.martinez@ejemplo.com', 'R4', 'Neurocirugía'),
  (gen_random_uuid(), 'Luis Fernando', 'García Mendoza', 'luis.garcia@ejemplo.com', 'R5', 'Investigación'),
  (gen_random_uuid(), 'Elena Isabel', 'López Herrera', 'elena.lopez@ejemplo.com', 'fellow', 'Epilepsia'),
  (gen_random_uuid(), 'Dr. Roberto', 'Fernández Silva', 'roberto.fernandez@ejemplo.com', 'attending', 'Staff Neurología')
ON CONFLICT (email) DO NOTHING;

-- Verify the data
SELECT
  first_name || ' ' || last_name as nombre_completo,
  email,
  training_level,
  current_rotation,
  status
FROM resident_profiles
WHERE status = 'active'
ORDER BY training_level;