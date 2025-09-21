-- Database setup for individual resident tracking
-- Execute this in Supabase SQL Editor

-- Table for tracking procedures performed by residents
CREATE TABLE IF NOT EXISTS user_procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  procedure_type VARCHAR NOT NULL, -- 'lumbar_puncture', 'eeg', 'emg', 'ultrasound', 'biopsy', 'other'
  procedure_name VARCHAR NOT NULL,
  patient_name VARCHAR,
  patient_dni VARCHAR,
  date_performed DATE NOT NULL,
  success BOOLEAN DEFAULT true,
  complications TEXT,
  notes TEXT,
  learning_points TEXT,
  supervisor VARCHAR, -- Attending physician who supervised
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking patients assigned to residents
CREATE TABLE IF NOT EXISTS user_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID, -- Can reference ward_round_patients or be independent
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

-- Table for tracking educational activities (classes, reviews, presentations)
CREATE TABLE IF NOT EXISTS user_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR NOT NULL, -- 'class', 'journal_review', 'presentation', 'conference', 'workshop'
  title VARCHAR NOT NULL,
  description TEXT,
  date_attended DATE NOT NULL,
  duration_hours INTEGER, -- Duration in hours
  instructor VARCHAR, -- Who taught/led the activity
  topic VARCHAR, -- Medical topic/specialty area
  assessment_score INTEGER, -- If there was an assessment (0-100)
  notes TEXT,
  certificates TEXT, -- Any certificates or documentation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for academic reviews and evaluations
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  review_type VARCHAR NOT NULL, -- 'monthly', 'quarterly', 'annual', 'rotation', 'case_based'
  reviewer_name VARCHAR NOT NULL, -- Attending or supervisor who did the review
  reviewer_role VARCHAR, -- 'attending', 'chief_resident', 'program_director'
  period_start DATE,
  period_end DATE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5), -- 1-5 scale
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

-- Table for tracking resident goals and milestones
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR NOT NULL, -- 'procedure', 'knowledge', 'research', 'clinical', 'professional'
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_procedures_user_id ON user_procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_procedures_date ON user_procedures(date_performed);
CREATE INDEX IF NOT EXISTS idx_user_procedures_type ON user_procedures(procedure_type);

CREATE INDEX IF NOT EXISTS idx_user_patients_user_id ON user_patients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patients_status ON user_patients(status);
CREATE INDEX IF NOT EXISTS idx_user_patients_date_assigned ON user_patients(date_assigned);

CREATE INDEX IF NOT EXISTS idx_user_classes_user_id ON user_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_classes_date ON user_classes(date_attended);
CREATE INDEX IF NOT EXISTS idx_user_classes_type ON user_classes(activity_type);

CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_date ON user_reviews(date_reviewed);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Policies for user_procedures
CREATE POLICY "Users can view their own procedures" ON user_procedures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own procedures" ON user_procedures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procedures" ON user_procedures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procedures" ON user_procedures
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_patients
CREATE POLICY "Users can view their own patients" ON user_patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients" ON user_patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" ON user_patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" ON user_patients
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_classes
CREATE POLICY "Users can view their own classes" ON user_classes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classes" ON user_classes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes" ON user_classes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes" ON user_classes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_reviews
CREATE POLICY "Users can view their own reviews" ON user_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON user_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON user_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_goals
CREATE POLICY "Users can view their own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON user_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_user_procedures_updated_at
  BEFORE UPDATE ON user_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_patients_updated_at
  BEFORE UPDATE ON user_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_classes_updated_at
  BEFORE UPDATE ON user_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_reviews_updated_at
  BEFORE UPDATE ON user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add column to ward_round_patients to track assigned resident
ALTER TABLE ward_round_patients
ADD COLUMN IF NOT EXISTS assigned_resident_id UUID REFERENCES auth.users(id);

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_assigned_resident
ON ward_round_patients(assigned_resident_id);

-- Update RLS policy for ward_round_patients to allow users to see their assigned patients
DROP POLICY IF EXISTS "Enable all operations for ward_round_patients" ON ward_round_patients;

CREATE POLICY "Enable read for assigned residents" ON ward_round_patients
  FOR SELECT USING (
    assigned_resident_id = auth.uid() OR
    assigned_resident_id IS NULL
  );

CREATE POLICY "Enable insert for all authenticated users" ON ward_round_patients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for all authenticated users" ON ward_round_patients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for all authenticated users" ON ward_round_patients
  FOR DELETE USING (auth.uid() IS NOT NULL);