-- Resident Profiles Schema
-- Links user authentication with detailed resident information and training progress

-- Main resident profiles table
CREATE TABLE IF NOT EXISTS resident_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,

  -- Training Information
  training_level TEXT NOT NULL CHECK (training_level IN ('R1', 'R2', 'R3', 'R4', 'R5', 'fellow', 'attending', 'intern')),
  program_year INTEGER CHECK (program_year BETWEEN 1 AND 7),
  start_date DATE NOT NULL,
  expected_graduation DATE,
  current_rotation TEXT,

  -- Hospital and Department
  hospital TEXT DEFAULT 'Hospital Nacional Prof. A. Posadas',
  department TEXT DEFAULT 'Servicio de Neurología',
  program_director TEXT,
  academic_coordinator TEXT,

  -- Contact and Emergency
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,

  -- Academic Information
  medical_school TEXT,
  graduation_year INTEGER,
  previous_internships TEXT[],
  research_interests TEXT[],
  publications TEXT[],

  -- Training Goals and Competencies
  learning_objectives TEXT[],
  completed_rotations JSONB DEFAULT '[]',
  competency_assessments JSONB DEFAULT '{}',

  -- Performance Tracking
  procedure_requirements JSONB DEFAULT '{}', -- Required procedure counts by type
  procedure_progress JSONB DEFAULT '{}', -- Current procedure counts

  -- Profile Settings
  profile_picture_url TEXT,
  bio TEXT,
  preferred_language TEXT DEFAULT 'es',
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'graduated', 'transferred', 'suspended')),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training milestones and requirements
CREATE TABLE IF NOT EXISTS training_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES resident_profiles(id) ON DELETE CASCADE,

  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('procedure', 'rotation', 'exam', 'research', 'presentation', 'competency')),
  milestone_name TEXT NOT NULL,
  description TEXT,

  -- Requirements
  required_for_level TEXT, -- R1, R2, etc.
  target_count INTEGER, -- For procedures
  deadline_date DATE,

  -- Progress
  current_count INTEGER DEFAULT 0,
  completion_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'waived')),

  -- Assessment
  supervisor_signature TEXT,
  evaluation_notes TEXT,
  competency_level TEXT CHECK (competency_level IN ('novice', 'advanced_beginner', 'competent', 'proficient', 'expert')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rotation assignments and history
CREATE TABLE IF NOT EXISTS rotation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES resident_profiles(id) ON DELETE CASCADE,

  rotation_name TEXT NOT NULL,
  rotation_type TEXT CHECK (rotation_type IN ('core', 'elective', 'subspecialty', 'research', 'community')),
  location TEXT,
  department TEXT,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Supervision
  attending_supervisor TEXT,
  senior_resident_supervisor TEXT,

  -- Objectives and Assessment
  learning_objectives TEXT[],
  evaluation_method TEXT,
  final_grade TEXT,
  evaluation_comments TEXT,

  -- Completion Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  completion_certificate_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supervision and mentorship relationships
CREATE TABLE IF NOT EXISTS supervision_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES resident_profiles(id) ON DELETE CASCADE,

  supervisor_name TEXT NOT NULL,
  supervisor_role TEXT CHECK (supervisor_role IN ('attending', 'chief_resident', 'program_director', 'research_mentor')),
  supervisor_email TEXT,

  relationship_type TEXT CHECK (relationship_type IN ('primary', 'secondary', 'research', 'clinical', 'academic')),
  start_date DATE NOT NULL,
  end_date DATE,

  -- Supervision Details
  meeting_frequency TEXT, -- "weekly", "biweekly", "monthly"
  focus_areas TEXT[],
  feedback_method TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resident_profiles_user_id ON resident_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resident_profiles_training_level ON resident_profiles(training_level);
CREATE INDEX IF NOT EXISTS idx_resident_profiles_status ON resident_profiles(status);
CREATE INDEX IF NOT EXISTS idx_training_milestones_resident_id ON training_milestones(resident_id);
CREATE INDEX IF NOT EXISTS idx_training_milestones_type ON training_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_rotation_assignments_resident_id ON rotation_assignments(resident_id);
CREATE INDEX IF NOT EXISTS idx_rotation_assignments_dates ON rotation_assignments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_supervision_relationships_resident_id ON supervision_relationships(resident_id);

-- Row Level Security
ALTER TABLE resident_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for resident_profiles
DROP POLICY IF EXISTS "Users manage own profile" ON resident_profiles;
CREATE POLICY "Users manage own profile" ON resident_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role access all profiles" ON resident_profiles;
CREATE POLICY "Service role access all profiles" ON resident_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for training_milestones
DROP POLICY IF EXISTS "Users access own milestones" ON training_milestones;
CREATE POLICY "Users access own milestones" ON training_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resident_profiles
      WHERE id = resident_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident_profiles
      WHERE id = resident_id AND user_id = auth.uid()
    )
  );

-- Policies for rotation_assignments
DROP POLICY IF EXISTS "Users access own rotations" ON rotation_assignments;
CREATE POLICY "Users access own rotations" ON rotation_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resident_profiles
      WHERE id = resident_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident_profiles
      WHERE id = resident_id AND user_id = auth.uid()
    )
  );

-- Policies for supervision_relationships
DROP POLICY IF EXISTS "Users access own supervision" ON supervision_relationships;
CREATE POLICY "Users access own supervision" ON supervision_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resident_profiles
      WHERE id = resident_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resident_profiles
      WHERE id = resident_id AND user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON resident_profiles TO authenticated;
GRANT ALL ON training_milestones TO authenticated;
GRANT ALL ON rotation_assignments TO authenticated;
GRANT ALL ON supervision_relationships TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Triggers for updated_at
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

DROP TRIGGER IF EXISTS tr_training_milestones_updated_at ON training_milestones;
CREATE TRIGGER tr_training_milestones_updated_at
  BEFORE UPDATE ON training_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_profiles_updated_at();

DROP TRIGGER IF EXISTS tr_rotation_assignments_updated_at ON rotation_assignments;
CREATE TRIGGER tr_rotation_assignments_updated_at
  BEFORE UPDATE ON rotation_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_profiles_updated_at();

DROP TRIGGER IF EXISTS tr_supervision_relationships_updated_at ON supervision_relationships;
CREATE TRIGGER tr_supervision_relationships_updated_at
  BEFORE UPDATE ON supervision_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_resident_profiles_updated_at();

-- Function to get comprehensive resident statistics
CREATE OR REPLACE FUNCTION get_resident_comprehensive_stats(resident_uuid UUID)
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
    (SELECT COUNT(*)::INTEGER FROM user_procedures WHERE user_id = resident_uuid) as total_procedures,

    -- Lumbar punctures count
    (SELECT COUNT(*)::INTEGER FROM lumbar_punctures WHERE resident_id = resident_uuid) as lumbar_punctures_count,

    -- Successful procedures (combining both tables)
    (
      (SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid AND success = true) +
      (SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid AND successful = true)
    )::INTEGER as successful_procedures,

    -- Success rate
    CASE
      WHEN (
        (SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid) +
        (SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid)
      ) > 0
      THEN ROUND(
        (
          (SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid AND success = true) +
          (SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid AND successful = true)
        )::DECIMAL /
        (
          (SELECT COUNT(*) FROM user_procedures WHERE user_id = resident_uuid) +
          (SELECT COUNT(*) FROM lumbar_punctures WHERE resident_id = resident_uuid)
        ) * 100,
        2
      )
      ELSE 0
    END as success_rate,

    -- Training milestones
    (SELECT COUNT(*)::INTEGER FROM training_milestones tm
     JOIN resident_profiles rp ON tm.resident_id = rp.id
     WHERE rp.user_id = resident_uuid AND tm.status = 'completed'
    ) as completed_milestones,

    (SELECT COUNT(*)::INTEGER FROM training_milestones tm
     JOIN resident_profiles rp ON tm.resident_id = rp.id
     WHERE rp.user_id = resident_uuid
    ) as total_milestones,

    -- Profile information
    (SELECT current_rotation FROM resident_profiles WHERE user_id = resident_uuid) as current_rotation,
    (SELECT training_level FROM resident_profiles WHERE user_id = resident_uuid) as training_level,
    (SELECT program_year FROM resident_profiles WHERE user_id = resident_uuid) as program_year,
    (SELECT (CURRENT_DATE - start_date)::INTEGER FROM resident_profiles WHERE user_id = resident_uuid) as days_in_program;
END;
$$ LANGUAGE plpgsql;