-- =====================================================
-- PENDING PATIENTS TABLE SETUP
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE pending_patients ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view patients in their accessible hospital contexts
-- Posadas is accessible to everyone, Julian only to privileged users
CREATE POLICY "Users can view accessible pending patients"
  ON pending_patients
  FOR SELECT
  USING (
    hospital_context = 'Posadas' OR
    (hospital_context = 'Julian' AND
     EXISTS (
       SELECT 1 FROM admin_privileges
       WHERE user_id = auth.uid()::text
       AND privilege_type = 'hospital_context_access'
     ))
  );

-- Policy 2: Authenticated users can insert patients
-- They can only insert into their accessible hospital contexts
CREATE POLICY "Authenticated users can create pending patients"
  ON pending_patients
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.jwt() ->> 'email' AND
    (
      hospital_context = 'Posadas' OR
      (hospital_context = 'Julian' AND
       EXISTS (
         SELECT 1 FROM admin_privileges
         WHERE user_id = auth.uid()::text
         AND privilege_type = 'hospital_context_access'
       ))
    )
  );

-- Policy 3: Users can update their own patients or if they have admin privileges
CREATE POLICY "Users can update their own pending patients"
  ON pending_patients
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (
      created_by = auth.jwt() ->> 'email' OR
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_id = auth.uid()::text
        AND privilege_type = 'full_admin'
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      created_by = auth.jwt() ->> 'email' OR
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_id = auth.uid()::text
        AND privilege_type = 'full_admin'
      )
    )
  );

-- Policy 4: Users can delete their own patients or if they have admin privileges
CREATE POLICY "Users can delete their own pending patients"
  ON pending_patients
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (
      created_by = auth.jwt() ->> 'email' OR
      EXISTS (
        SELECT 1 FROM admin_privileges
        WHERE user_id = auth.uid()::text
        AND privilege_type = 'full_admin'
      )
    )
  );

-- =====================================================
-- SAMPLE DATA (optional - for testing)
-- =====================================================

-- Uncomment to insert sample data:
/*
INSERT INTO pending_patients (
  patient_name,
  age,
  dni,
  admission_date,
  chief_complaint,
  clinical_notes,
  differential_diagnoses,
  pending_tests,
  color,
  priority,
  tags,
  hospital_context,
  created_by
) VALUES
(
  'Juan Pérez',
  45,
  '12345678',
  CURRENT_DATE - INTERVAL '3 days',
  'Cefalea y alteración del sensorio',
  'Paciente con cefalea intensa de 3 días de evolución. TAC sin lesiones agudas. LCR: pleocitosis linfocitaria. PCR HSV pendiente.',
  ARRAY['Encefalitis viral', 'Meningitis bacteriana parcialmente tratada', 'Encefalitis autoinmune'],
  ARRAY['PCR HSV en LCR', 'Panel autoinmune', 'RMN cerebral con contraste'],
  'red',
  'urgent',
  ARRAY['infeccioso', 'urgente'],
  'Posadas',
  'test@example.com'
),
(
  'María González',
  67,
  '23456789',
  CURRENT_DATE - INTERVAL '7 days',
  'Deterioro cognitivo progresivo',
  'Paciente con deterioro cognitivo de 6 meses de evolución. MMSE 20/30. RMN: atrofia temporal bilateral.',
  ARRAY['Enfermedad de Alzheimer', 'Demencia frontotemporal', 'Depresión pseudodemencia'],
  ARRAY['PET amiloide', 'Evaluación neuropsicológica completa', 'Punción lumbar con biomarcadores'],
  'orange',
  'high',
  ARRAY['demencia', 'ambulatorio'],
  'Posadas',
  'test@example.com'
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

-- =====================================================
-- NOTES
-- =====================================================

-- To run this script:
-- 1. Copy the entire content
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and click "Run"
--
-- Hospital Context Behavior:
-- - Posadas: Public hospital, accessible to all authenticated users
-- - Julian: Private practice, restricted to users with 'hospital_context_access' privilege
--
-- Priority Levels:
-- - urgent: Casos críticos que requieren atención inmediata
-- - high: Alta prioridad, seguimiento cercano
-- - medium: Prioridad estándar
-- - low: Baja prioridad, seguimiento rutinario
--
-- Color System (Google Keep style):
-- - default: Sin color especial
-- - red: Casos urgentes/críticos
-- - orange: Alta prioridad
-- - yellow: Alertas/pendientes
-- - green: Progresando bien
-- - blue: Información/notas
-- - purple: Especiales/VIP
-- - pink: Marcadores personalizados
