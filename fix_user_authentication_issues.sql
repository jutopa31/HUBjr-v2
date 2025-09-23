-- Fix for user authentication and data access issues
-- This script addresses the 404 errors when logging in with different users
-- Execute this in Supabase SQL Editor

-- First, ensure all required tables exist
-- Execute the main setup scripts if they haven't been run:

-- 1. Create user tracking tables if they don't exist
CREATE TABLE IF NOT EXISTS user_procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  procedure_type VARCHAR NOT NULL,
  procedure_name VARCHAR NOT NULL,
  patient_name VARCHAR,
  patient_dni VARCHAR,
  date_performed DATE NOT NULL,
  success BOOLEAN DEFAULT true,
  complications TEXT,
  notes TEXT,
  learning_points TEXT,
  supervisor VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID,
  patient_name VARCHAR NOT NULL,
  patient_dni VARCHAR,
  diagnosis VARCHAR,
  date_assigned DATE NOT NULL,
  date_discharged DATE,
  status VARCHAR CHECK (status IN ('active', 'discharged', 'transferred')) DEFAULT 'active',
  outcome TEXT,
  learning_outcomes TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  date_attended DATE NOT NULL,
  duration_hours INTEGER,
  instructor VARCHAR,
  topic VARCHAR,
  assessment_score INTEGER,
  notes TEXT,
  certificates TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  review_type VARCHAR NOT NULL,
  reviewer_name VARCHAR NOT NULL,
  reviewer_role VARCHAR,
  period_start DATE,
  period_end DATE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  clinical_skills_rating INTEGER CHECK (clinical_skills_rating >= 1 AND clinical_skills_rating <= 5),
  knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_next_period TEXT,
  comments TEXT,
  date_reviewed DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  target_date DATE,
  priority VARCHAR CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status VARCHAR CHECK (status IN ('not_started', 'in_progress', 'completed', 'deferred')) DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resident_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  training_level TEXT NOT NULL CHECK (training_level IN ('R1', 'R2', 'R3', 'R4', 'R5', 'fellow', 'attending', 'intern')),
  program_year INTEGER CHECK (program_year BETWEEN 1 AND 7),
  start_date DATE NOT NULL,
  expected_graduation DATE,
  current_rotation TEXT,
  hospital TEXT DEFAULT 'Hospital Nacional Prof. A. Posadas',
  department TEXT DEFAULT 'Servicio de Neurología',
  program_director TEXT,
  academic_coordinator TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  medical_school TEXT,
  graduation_year INTEGER,
  previous_internships TEXT[],
  research_interests TEXT[],
  publications TEXT[],
  learning_objectives TEXT[],
  completed_rotations JSONB DEFAULT '[]',
  competency_assessments JSONB DEFAULT '{}',
  procedure_requirements JSONB DEFAULT '{}',
  procedure_progress JSONB DEFAULT '{}',
  profile_picture_url TEXT,
  bio TEXT,
  preferred_language TEXT DEFAULT 'es',
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'graduated', 'transferred', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all RLS policies are in place
ALTER TABLE user_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Policies for user_procedures
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_procedures' AND policyname = 'Users can manage their own procedures'
  ) THEN
    CREATE POLICY "Users can manage their own procedures" ON user_procedures
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies for user_patients
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_patients' AND policyname = 'Users can manage their own patients'
  ) THEN
    CREATE POLICY "Users can manage their own patients" ON user_patients
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies for user_classes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_classes' AND policyname = 'Users can manage their own classes'
  ) THEN
    CREATE POLICY "Users can manage their own classes" ON user_classes
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies for user_reviews
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_reviews' AND policyname = 'Users can manage their own reviews'
  ) THEN
    CREATE POLICY "Users can manage their own reviews" ON user_reviews
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies for user_goals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_goals' AND policyname = 'Users can manage their own goals'
  ) THEN
    CREATE POLICY "Users can manage their own goals" ON user_goals
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies for resident_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'resident_profiles' AND policyname = 'Users manage own profile'
  ) THEN
    CREATE POLICY "Users manage own profile" ON resident_profiles
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_procedures_user_id ON user_procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patients_user_id ON user_patients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_classes_user_id ON user_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_resident_profiles_user_id ON resident_profiles(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_procedures TO authenticated;
GRANT ALL ON user_patients TO authenticated;
GRANT ALL ON user_classes TO authenticated;
GRANT ALL ON user_reviews TO authenticated;
GRANT ALL ON user_goals TO authenticated;
GRANT ALL ON resident_profiles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Function to initialize a new user's data when they first log in
CREATE OR REPLACE FUNCTION initialize_new_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a basic resident profile for new users if one doesn't exist
  INSERT INTO resident_profiles (
    user_id,
    first_name,
    last_name,
    email,
    training_level,
    program_year,
    start_date
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuario'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'training_level', 'R1'),
    COALESCE((NEW.raw_user_meta_data->>'program_year')::integer, 1),
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically initialize new users
DROP TRIGGER IF EXISTS on_auth_user_created_initialize_data ON auth.users;
CREATE TRIGGER on_auth_user_created_initialize_data
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_new_user_data();

-- Function to get comprehensive resident statistics (safe version with null checks)
CREATE OR REPLACE FUNCTION get_resident_comprehensive_stats_safe(resident_uuid UUID)
RETURNS TABLE (
  total_procedures INTEGER,
  lumbar_punctures_count INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  completed_milestones INTEGER,
  total_milestones INTEGER,
  current_rotation TEXT,
  training_level TEXT,
  program_year INTEGER,
  days_in_program INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Generic procedures count
    COALESCE((SELECT COUNT(*)::INTEGER FROM user_procedures WHERE user_id = resident_uuid), 0) as total_procedures,

    -- Lumbar punctures count (safe check for table existence)
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM lumbar_punctures
      WHERE resident_id = resident_uuid
    ), 0) as lumbar_punctures_count,

    -- Successful procedures (combining both tables with safe checks)
    COALESCE((
      COALESCE((SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid AND success = true), 0) +
      COALESCE((SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid AND successful = true), 0)
    ), 0)::INTEGER as successful_procedures,

    -- Success rate (safe calculation)
    CASE
      WHEN COALESCE((
        COALESCE((SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid), 0) +
        COALESCE((SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid), 0)
      ), 0) > 0
      THEN ROUND(
        COALESCE((
          COALESCE((SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid AND success = true), 0) +
          COALESCE((SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid AND successful = true), 0)
        ), 0)::DECIMAL /
        COALESCE((
          COALESCE((SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid), 0) +
          COALESCE((SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid), 0)
        ), 1) * 100,
        2
      )
      ELSE 0
    END as success_rate,

    -- Training milestones (safe check)
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM training_milestones tm
      JOIN resident_profiles rp ON tm.resident_id = rp.id
      WHERE rp.user_id = resident_uuid AND tm.status = 'completed'
    ), 0) as completed_milestones,

    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM training_milestones tm
      JOIN resident_profiles rp ON tm.resident_id = rp.id
      WHERE rp.user_id = resident_uuid
    ), 0) as total_milestones,

    -- Profile information (with safe defaults)
    COALESCE((SELECT current_rotation FROM resident_profiles WHERE user_id = resident_uuid), 'No asignado') as current_rotation,
    COALESCE((SELECT training_level FROM resident_profiles WHERE user_id = resident_uuid), 'R1') as training_level,
    COALESCE((SELECT program_year FROM resident_profiles WHERE user_id = resident_uuid), 1) as program_year,
    COALESCE((SELECT (CURRENT_DATE - start_date)::INTEGER FROM resident_profiles WHERE user_id = resident_uuid), 0) as days_in_program;

EXCEPTION
  WHEN OTHERS THEN
    -- Return safe defaults if any error occurs
    RETURN QUERY SELECT 0, 0, 0, 0.0::DECIMAL(5,2), 0, 0, 'No asignado'::TEXT, 'R1'::TEXT, 1, 0;
END;
$$ LANGUAGE plpgsql;

-- Verify that all tables exist and are properly set up
DO $$
DECLARE
    tbl_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    -- Check for required tables
    FOR tbl_name IN VALUES ('user_procedures'), ('user_patients'), ('user_classes'), ('user_reviews'), ('user_goals'), ('resident_profiles')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables detected: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE 'Please ensure all setup scripts have been executed.';
    ELSE
        RAISE NOTICE 'All required tables are present and configured.';
    END IF;
END $$;