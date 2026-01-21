-- ============================================================
-- HUBJR V3 - Unified Patient Table Setup
-- ============================================================
-- This creates the unified patients_v3 table for the
-- Evolucionador-centric architecture where all patient data
-- flows through a single entry point.
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Main patients_v3 table
-- ============================================================
CREATE TABLE IF NOT EXISTS patients_v3 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Required fields (Brief Save)
  dni VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  cama VARCHAR,

  -- Lifecycle tracking
  current_destination VARCHAR CHECK (current_destination IN
    ('interconsulta', 'pase_sala', 'post_alta', 'ambulatorio')) NOT NULL DEFAULT 'interconsulta',

  -- Journey history (patient visible in multiple views)
  -- Example: [{"destination": "interconsulta", "entered_at": "...", "exited_at": "..."}]
  destinations_history JSONB DEFAULT '[]'::jsonb,

  -- Clinical data (progressive)
  edad VARCHAR,
  relato_consulta TEXT,        -- Initial complaint
  antecedentes TEXT,
  examen_fisico TEXT,
  estudios TEXT,
  diagnostico TEXT,
  plan TEXT,
  pendientes TEXT,

  -- Evolution notes (accumulated)
  -- Example: [{"id": "...", "fecha": "...", "nota": "...", "ai_assisted": true}]
  evoluciones JSONB DEFAULT '[]'::jsonb,

  -- AI content
  ai_draft TEXT,
  ai_summary TEXT,

  -- Key dates
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  fecha_alta DATE,
  fecha_cita_seguimiento DATE,

  -- Media (unified)
  -- Example: [{"id": "...", "url": "...", "thumbnail": "...", "type": "photo|ocr|document"}]
  images JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  hospital_context VARCHAR DEFAULT 'Posadas',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_v3_dni ON patients_v3(dni);
CREATE INDEX IF NOT EXISTS idx_patients_v3_nombre ON patients_v3(nombre);
CREATE INDEX IF NOT EXISTS idx_patients_v3_destination ON patients_v3(current_destination);
CREATE INDEX IF NOT EXISTS idx_patients_v3_hospital ON patients_v3(hospital_context);
CREATE INDEX IF NOT EXISTS idx_patients_v3_user ON patients_v3(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_v3_fecha_ingreso ON patients_v3(fecha_ingreso);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE patients_v3 ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all patients in Posadas context
-- or Julian context if they have hospital_context_access privilege
CREATE POLICY "Users can view patients in their context"
  ON patients_v3 FOR SELECT
  USING (
    hospital_context = 'Posadas' OR
    (hospital_context = 'Julian' AND
     EXISTS (
       SELECT 1 FROM admin_privileges
       WHERE user_email = (SELECT COALESCE(auth.jwt()->>'email', ''))
       AND privilege_type = 'hospital_context_access'
     ))
  );

-- Policy: Authenticated users can insert patients
CREATE POLICY "Authenticated users can insert patients"
  ON patients_v3 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update patients in accessible contexts
CREATE POLICY "Users can update accessible patients"
  ON patients_v3 FOR UPDATE
  USING (
    user_id = auth.uid() OR
    hospital_context = 'Posadas' OR
    (hospital_context = 'Julian' AND
     EXISTS (
       SELECT 1 FROM admin_privileges
       WHERE user_email = (SELECT COALESCE(auth.jwt()->>'email', ''))
       AND privilege_type = 'hospital_context_access'
     ))
  );

-- Policy: Users can delete patients they created or any in Posadas
CREATE POLICY "Users can delete their patients"
  ON patients_v3 FOR DELETE
  USING (
    user_id = auth.uid() OR
    hospital_context = 'Posadas'
  );

-- ============================================================
-- Trigger for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_patients_v3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_patients_v3_updated_at ON patients_v3;
CREATE TRIGGER trigger_patients_v3_updated_at
  BEFORE UPDATE ON patients_v3
  FOR EACH ROW
  EXECUTE FUNCTION update_patients_v3_updated_at();

-- ============================================================
-- Helper function to transition patient destination
-- ============================================================
CREATE OR REPLACE FUNCTION transition_patient_destination(
  p_patient_id UUID,
  p_new_destination VARCHAR,
  p_notes TEXT DEFAULT NULL
)
RETURNS patients_v3 AS $$
DECLARE
  v_patient patients_v3;
  v_old_destination VARCHAR;
  v_history JSONB;
BEGIN
  -- Get current patient state
  SELECT * INTO v_patient FROM patients_v3 WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient not found: %', p_patient_id;
  END IF;

  v_old_destination := v_patient.current_destination;
  v_history := v_patient.destinations_history;

  -- Update the last history entry with exit time
  IF jsonb_array_length(v_history) > 0 THEN
    v_history := jsonb_set(
      v_history,
      ARRAY[(jsonb_array_length(v_history) - 1)::text, 'exited_at'],
      to_jsonb(NOW()::text)
    );
  END IF;

  -- Add new history entry
  v_history := v_history || jsonb_build_object(
    'destination', p_new_destination,
    'entered_at', NOW()::text,
    'notes', p_notes
  );

  -- Update patient
  UPDATE patients_v3
  SET
    current_destination = p_new_destination,
    destinations_history = v_history,
    updated_at = NOW()
  WHERE id = p_patient_id
  RETURNING * INTO v_patient;

  RETURN v_patient;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- View for destination counts
-- ============================================================
CREATE OR REPLACE VIEW patients_v3_destination_counts AS
SELECT
  hospital_context,
  COUNT(*) FILTER (WHERE current_destination = 'interconsulta') AS interconsulta_count,
  COUNT(*) FILTER (WHERE current_destination = 'pase_sala') AS pase_sala_count,
  COUNT(*) FILTER (WHERE current_destination = 'post_alta') AS post_alta_count,
  COUNT(*) FILTER (WHERE current_destination = 'ambulatorio') AS ambulatorio_count,
  COUNT(*) AS total_count
FROM patients_v3
GROUP BY hospital_context;

-- ============================================================
-- Grant permissions
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON patients_v3 TO authenticated;
GRANT SELECT ON patients_v3_destination_counts TO authenticated;
GRANT EXECUTE ON FUNCTION transition_patient_destination TO authenticated;
