-- =====================================================
-- PENDING PATIENTS TABLE SETUP (FIXED VERSION)
-- Tabla para pacientes sin diagnóstico claro
-- Interfaz estilo Google Keep para tracking diagnóstico
-- =====================================================

-- Drop existing table if exists (use with caution in production)
-- DROP TABLE IF EXISTS pending_patients CASCADE;

-- Create pending_patients table
CREATE TABLE IF NOT EXISTS pending_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Patient identification
  patient_name VARCHAR(255) NOT NULL,
  age INTEGER,
  dni VARCHAR(20),
  admission_date DATE,

  -- Clinical information
  chief_complaint TEXT NOT NULL,
  clinical_notes TEXT NOT NULL,
  differential_diagnoses TEXT[], -- Array de diagnósticos diferenciales
  pending_tests TEXT[], -- Array de estudios pendientes

  -- Organization and categorization
  color VARCHAR(20) NOT NULL DEFAULT 'default', -- Color de la tarjeta (Google Keep style)
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- urgent, high, medium, low
  tags TEXT[], -- Tags para categorización

  -- Hospital context (multi-hospital separation)
  hospital_context VARCHAR(50) NOT NULL DEFAULT 'Posadas',

  -- Resolution tracking
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  final_diagnosis TEXT,

  -- Audit fields
  created_by VARCHAR(255) NOT NULL, -- User email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_color CHECK (color IN ('default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink')),
  CONSTRAINT valid_priority CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  CONSTRAINT valid_hospital_context CHECK (hospital_context IN ('Posadas', 'Julian')),
  CONSTRAINT resolved_diagnosis_check CHECK (
    (resolved = FALSE AND resolved_at IS NULL AND final_diagnosis IS NULL) OR
    (resolved = TRUE AND final_diagnosis IS NOT NULL)
  )
);

-- =====================================================
-- INDEXES for performance optimization
-- =====================================================

-- Index for hospital context filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_pending_patients_hospital_context
  ON pending_patients(hospital_context);

-- Index for resolved status filtering
CREATE INDEX IF NOT EXISTS idx_pending_patients_resolved
  ON pending_patients(resolved);

-- Index for priority sorting
CREATE INDEX IF NOT EXISTS idx_pending_patients_priority
  ON pending_patients(priority);

-- Index for created_by (user's own patients)
CREATE INDEX IF NOT EXISTS idx_pending_patients_created_by
  ON pending_patients(created_by);

-- Composite index for common queries (hospital + resolved + priority)
CREATE INDEX IF NOT EXISTS idx_pending_patients_composite
  ON pending_patients(hospital_context, resolved, priority, created_at DESC);

-- Full-text search index for patient name and clinical notes
CREATE INDEX IF NOT EXISTS idx_pending_patients_search
  ON pending_patients USING gin(to_tsvector('spanish',
    patient_name || ' ' || chief_complaint || ' ' || clinical_notes
  ));

-- =====================================================
-- TRIGGER for automatic updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_pending_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pending_patients_updated_at ON pending_patients;

CREATE TRIGGER trigger_pending_patients_updated_at
  BEFORE UPDATE ON pending_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_patients_updated_at();

-- =====================================================
-- TRIGGER for automatic resolved_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION set_pending_patients_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved = TRUE AND OLD.resolved = FALSE THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.resolved = FALSE THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pending_patients_resolved_at ON pending_patients;

CREATE TRIGGER trigger_pending_patients_resolved_at
  BEFORE UPDATE ON pending_patients
  FOR EACH ROW
  EXECUTE FUNCTION set_pending_patients_resolved_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - SIMPLIFIED VERSION
-- =====================================================

-- Enable RLS
ALTER TABLE pending_patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view accessible pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Authenticated users can create pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can update their own pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can delete their own pending patients" ON pending_patients;

-- Policy 1: Users can view patients in Posadas (public)
-- For Julian context, we'll use a simpler check that can be enhanced later
CREATE POLICY "Users can view accessible pending patients"
  ON pending_patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      hospital_context = 'Posadas' OR
      (hospital_context = 'Julian' AND
       EXISTS (
         SELECT 1 FROM admin_privileges
         WHERE user_id = (auth.uid())::text
         AND privilege_type = 'hospital_context_access'
       ))
    )
  );

-- Policy 2: Authenticated users can insert patients into Posadas
-- For Julian, only users with privileges can insert
CREATE POLICY "Authenticated users can create pending patients"
  ON pending_patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')::text AND
    (
      hospital_context = 'Posadas' OR
      (hospital_context = 'Julian' AND
       EXISTS (
         SELECT 1 FROM admin_privileges
         WHERE user_id = (auth.uid())::text
         AND privilege_type = 'hospital_context_access'
       ))
    )
  );

-- Policy 3: Users can update their own patients
CREATE POLICY "Users can update their own pending patients"
  ON pending_patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (
      created_by = (auth.jwt() ->> 'email')::text OR
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_id = (auth.uid())::text
        AND privilege_type = 'full_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      created_by = (auth.jwt() ->> 'email')::text OR
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_id = (auth.uid())::text
        AND privilege_type = 'full_admin'
      )
    )
  );

-- Policy 4: Users can delete their own patients
CREATE POLICY "Users can delete their own pending patients"
  ON pending_patients
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (
      created_by = (auth.jwt() ->> 'email')::text OR
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_id = (auth.uid())::text
        AND privilege_type = 'full_admin'
      )
    )
  );

-- =====================================================
-- FALLBACK: If admin_privileges doesn't exist, use simpler policies
-- Uncomment this section if you get errors about admin_privileges
-- =====================================================

/*
-- Drop policies that reference admin_privileges
DROP POLICY IF EXISTS "Users can view accessible pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Authenticated users can create pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can update their own pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can delete their own pending patients" ON pending_patients;

-- Simple policy 1: All authenticated users can view Posadas patients
CREATE POLICY "Users can view pending patients"
  ON pending_patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND hospital_context = 'Posadas'
  );

-- Simple policy 2: Authenticated users can create patients in Posadas
CREATE POLICY "Users can create pending patients"
  ON pending_patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')::text AND
    hospital_context = 'Posadas'
  );

-- Simple policy 3: Users can update their own patients
CREATE POLICY "Users can update own pending patients"
  ON pending_patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')::text
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')::text
  );

-- Simple policy 4: Users can delete their own patients
CREATE POLICY "Users can delete own pending patients"
  ON pending_patients
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = (auth.jwt() ->> 'email')::text
  );
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table was created successfully
-- SELECT * FROM pending_patients LIMIT 5;

-- Verify indexes were created
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'pending_patients';

-- Verify RLS policies are active
-- SELECT * FROM pg_policies WHERE tablename = 'pending_patients';

-- Check if admin_privileges table exists
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_privileges');
