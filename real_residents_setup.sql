-- Setup with REAL emails from Supabase auth.users
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
CREATE INDEX idx_resident_profiles_email ON resident_profiles(email);
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

-- Insert data with REAL emails from auth.users
-- IMPORTANT: Use the actual emails from your Supabase auth.users table

INSERT INTO resident_profiles (user_id, first_name, last_name, email, training_level, current_rotation)
VALUES
  -- Replace with actual user_ids from: SELECT id, email FROM auth.users WHERE email IN (...);
  (gen_random_uuid(), 'Julián Martín', 'Alonso', 'julian.martin.alonso@gmail.com', 'R4', 'Neurología General'),
  (gen_random_uuid(), 'Tatiana', 'Chamu', 'tatianachamu11@gmail.com', 'R2', 'Stroke Unit'),
  (gen_random_uuid(), 'Serena', 'Angulo', 'serena.angulo@gmail.com', 'R3', 'Neurofisiología'),
  (gen_random_uuid(), 'Jorge Elias', 'Loor Vera', 'eliasloor98@gmail.com', 'R1', 'Neurología General'),
  (gen_random_uuid(), 'Jaqueline', 'Molina', 'jaqueline.molina@gmail.com', 'R5', 'Epilepsia')
ON CONFLICT (email) DO NOTHING;

-- Also add some example residents with fake emails for testing
INSERT INTO resident_profiles (user_id, first_name, last_name, email, training_level, current_rotation)
VALUES
  (gen_random_uuid(), 'Carlos Alberto', 'Rodríguez', 'carlos.rodriguez@ejemplo.com', 'fellow', 'Neurocirugía'),
  (gen_random_uuid(), 'Dr. Roberto', 'Fernández', 'roberto.fernandez@ejemplo.com', 'attending', 'Staff Neurología')
ON CONFLICT (email) DO NOTHING;

-- IMPORTANT: Update user_ids with real ones from auth.users
-- Run this query first to get the real user_ids:
-- SELECT id, email FROM auth.users WHERE email IN (
--   'julian.martin.alonso@gmail.com',
--   'tatianachamu11@gmail.com',
--   'serena.angulo@gmail.com',
--   'eliasloor98@gmail.com',
--   'jaqueline.molina@gmail.com'
-- );

-- Then update the resident_profiles with the real user_ids:
-- UPDATE resident_profiles SET user_id = 'REAL_USER_ID_HERE' WHERE email = 'julian.martin.alonso@gmail.com';
-- UPDATE resident_profiles SET user_id = 'REAL_USER_ID_HERE' WHERE email = 'tatianachamu11@gmail.com';
-- etc...

-- Verify the data
SELECT
  first_name || ' ' || last_name as nombre_completo,
  email,
  training_level,
  current_rotation,
  status,
  user_id
FROM resident_profiles
WHERE status = 'active'
ORDER BY training_level;