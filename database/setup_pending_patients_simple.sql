-- =====================================================
-- PENDING PATIENTS TABLE SETUP (SIMPLE VERSION)
-- Sin dependencias de admin_privileges
-- =====================================================

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
  differential_diagnoses TEXT[],
  pending_tests TEXT[],

  -- Organization
  color VARCHAR(20) NOT NULL DEFAULT 'default',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  tags TEXT[],

  -- Hospital context
  hospital_context VARCHAR(50) NOT NULL DEFAULT 'Posadas',

  -- Resolution tracking
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  final_diagnosis TEXT,

  -- Audit fields
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_color CHECK (color IN ('default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink')),
  CONSTRAINT valid_priority CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  CONSTRAINT valid_hospital_context CHECK (hospital_context IN ('Posadas', 'Julian'))
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pending_patients_hospital_context ON pending_patients(hospital_context);
CREATE INDEX IF NOT EXISTS idx_pending_patients_resolved ON pending_patients(resolved);
CREATE INDEX IF NOT EXISTS idx_pending_patients_priority ON pending_patients(priority);
CREATE INDEX IF NOT EXISTS idx_pending_patients_created_by ON pending_patients(created_by);
CREATE INDEX IF NOT EXISTS idx_pending_patients_composite ON pending_patients(hospital_context, resolved, priority, created_at DESC);

-- =====================================================
-- TRIGGERS
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
-- RLS POLICIES (SIMPLE - TODOS LOS USUARIOS AUTENTICADOS)
-- =====================================================

ALTER TABLE pending_patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can create pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can update own pending patients" ON pending_patients;
DROP POLICY IF EXISTS "Users can delete own pending patients" ON pending_patients;

-- Policy 1: SELECT - Ver pacientes del contexto Posadas (todos los usuarios)
CREATE POLICY "Users can view pending patients"
  ON pending_patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Policy 2: INSERT - Crear pacientes (todos los usuarios autenticados)
CREATE POLICY "Users can create pending patients"
  ON pending_patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 3: UPDATE - Actualizar solo propios pacientes
CREATE POLICY "Users can update own pending patients"
  ON pending_patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 4: DELETE - Eliminar solo propios pacientes
CREATE POLICY "Users can delete own pending patients"
  ON pending_patients
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
