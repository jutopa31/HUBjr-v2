-- Enhanced Lumbar Puncture Database Schema
-- Comprehensive tracking for neurological lumbar puncture procedures

-- Main lumbar puncture table with detailed clinical data
CREATE TABLE IF NOT EXISTS lumbar_punctures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id TEXT, -- Optional reference to patient in system
  patient_initials TEXT NOT NULL CHECK (char_length(patient_initials) <= 4),
  patient_age INTEGER CHECK (patient_age > 0 AND patient_age <= 120),
  patient_gender TEXT CHECK (patient_gender IN ('M', 'F', 'Other')),

  -- Procedure details
  procedure_date DATE NOT NULL,
  procedure_time TIME,
  indication TEXT NOT NULL, -- Reason for LP
  supervisor TEXT NOT NULL,
  trainee_role TEXT CHECK (trainee_role IN ('observer', 'assisted', 'performed_supervised', 'performed_independent')),

  -- Pre-procedure
  contraindications_checked BOOLEAN DEFAULT false,
  informed_consent BOOLEAN DEFAULT false,
  platelet_count INTEGER, -- if available
  inr_value DECIMAL(3,2), -- if available

  -- Procedure technique
  patient_position TEXT CHECK (patient_position IN ('lateral_decubitus', 'sitting', 'prone')),
  needle_level TEXT CHECK (needle_level IN ('L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'other')),
  needle_gauge TEXT CHECK (needle_gauge IN ('20G', '22G', '25G', 'other')),
  needle_type TEXT CHECK (needle_type IN ('quincke', 'sprotte', 'whitacre', 'other')),
  local_anesthetic TEXT DEFAULT 'lidocaine',

  -- Procedure outcomes
  successful BOOLEAN NOT NULL DEFAULT false,
  attempts_count INTEGER DEFAULT 1 CHECK (attempts_count >= 1),
  bloody_tap BOOLEAN DEFAULT false,
  traumatic_tap BOOLEAN DEFAULT false,
  dry_tap BOOLEAN DEFAULT false,

  -- Opening pressure
  opening_pressure_measured BOOLEAN DEFAULT false,
  opening_pressure_value INTEGER, -- in cmH2O
  opening_pressure_notes TEXT,

  -- CSF analysis results
  csf_appearance TEXT CHECK (csf_appearance IN ('clear', 'cloudy', 'turbid', 'bloody', 'xanthochromic')),
  csf_volume_collected INTEGER, -- in mL

  -- Laboratory results
  csf_white_cells INTEGER, -- cells/μL
  csf_red_cells INTEGER, -- cells/μL
  csf_protein DECIMAL(5,2), -- mg/dL
  csf_glucose DECIMAL(5,2), -- mg/dL
  serum_glucose DECIMAL(5,2), -- mg/dL for comparison
  csf_lactate DECIMAL(5,2), -- mmol/L

  -- Microbiology
  gram_stain_result TEXT,
  culture_sent BOOLEAN DEFAULT false,
  pcr_tests_sent TEXT[], -- array of PCR tests ordered
  antigen_tests_sent TEXT[], -- array of antigen tests

  -- Special studies
  cytology_sent BOOLEAN DEFAULT false,
  flow_cytometry_sent BOOLEAN DEFAULT false,
  oligoclonal_bands_sent BOOLEAN DEFAULT false,

  -- Complications
  headache_post_lp BOOLEAN DEFAULT false,
  headache_severity INTEGER CHECK (headache_severity BETWEEN 1 AND 10),
  nausea_vomiting BOOLEAN DEFAULT false,
  back_pain BOOLEAN DEFAULT false,
  bleeding BOOLEAN DEFAULT false,
  infection BOOLEAN DEFAULT false,
  other_complications TEXT,

  -- Follow-up
  patient_discharge_same_day BOOLEAN DEFAULT true,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,

  -- Educational value
  learning_objectives_met TEXT,
  supervisor_feedback TEXT,
  resident_reflection TEXT,
  technical_difficulty INTEGER CHECK (technical_difficulty BETWEEN 1 AND 5), -- 1=easy, 5=very difficult

  -- Clinical context
  primary_diagnosis TEXT,
  differential_diagnosis TEXT[],
  clinical_question TEXT,

  -- Administrative
  procedure_location TEXT DEFAULT 'bedside',
  assistance_required TEXT[], -- array of additional help needed
  equipment_issues TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CSF analysis details (separate table for detailed lab results)
CREATE TABLE IF NOT EXISTS csf_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lumbar_puncture_id UUID NOT NULL REFERENCES lumbar_punctures(id) ON DELETE CASCADE,

  -- Detailed cell counts
  lymphocytes INTEGER, -- cells/μL
  neutrophils INTEGER, -- cells/μL
  monocytes INTEGER, -- cells/μL
  eosinophils INTEGER, -- cells/μL

  -- Additional chemistry
  csf_chloride DECIMAL(5,2), -- mEq/L
  csf_albumin DECIMAL(5,2), -- mg/dL
  csf_igg DECIMAL(5,2), -- mg/dL
  albumin_ratio DECIMAL(5,3), -- CSF/serum albumin ratio
  igg_index DECIMAL(5,3),

  -- Specific markers
  tau_protein DECIMAL(8,2), -- pg/mL
  phospho_tau DECIMAL(8,2), -- pg/mL
  amyloid_beta_42 DECIMAL(8,2), -- pg/mL
  amyloid_beta_40 DECIMAL(8,2), -- pg/mL

  -- Infectious markers
  bacterial_antigen_results JSONB, -- Store multiple antigen test results
  viral_pcr_results JSONB, -- Store multiple PCR results
  fungal_studies JSONB,

  -- Final interpretation
  laboratory_interpretation TEXT,
  clinically_significant BOOLEAN,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lumbar puncture complications tracking
CREATE TABLE IF NOT EXISTS lp_complications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lumbar_puncture_id UUID NOT NULL REFERENCES lumbar_punctures(id) ON DELETE CASCADE,

  complication_type TEXT NOT NULL CHECK (complication_type IN (
    'post_dural_puncture_headache',
    'cerebral_herniation',
    'bleeding',
    'infection',
    'nerve_root_injury',
    'failed_procedure',
    'other'
  )),

  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  onset_time INTERVAL, -- time from procedure
  duration INTERVAL, -- how long it lasted
  treatment_required BOOLEAN DEFAULT false,
  treatment_details TEXT,
  resolution_status TEXT CHECK (resolution_status IN ('resolved', 'ongoing', 'chronic')),

  reported_to_supervisor BOOLEAN DEFAULT true,
  incident_report_filed BOOLEAN DEFAULT false,

  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lumbar_punctures_resident_id
  ON lumbar_punctures(resident_id);

CREATE INDEX IF NOT EXISTS idx_lumbar_punctures_procedure_date
  ON lumbar_punctures(procedure_date);

CREATE INDEX IF NOT EXISTS idx_lumbar_punctures_successful
  ON lumbar_punctures(successful);

CREATE INDEX IF NOT EXISTS idx_lumbar_punctures_indication
  ON lumbar_punctures USING gin(to_tsvector('english', indication));

CREATE INDEX IF NOT EXISTS idx_csf_analysis_lp_id
  ON csf_analysis_results(lumbar_puncture_id);

CREATE INDEX IF NOT EXISTS idx_lp_complications_lp_id
  ON lp_complications(lumbar_puncture_id);

CREATE INDEX IF NOT EXISTS idx_lp_complications_type
  ON lp_complications(complication_type);

-- Row Level Security
ALTER TABLE lumbar_punctures ENABLE ROW LEVEL SECURITY;
ALTER TABLE csf_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_complications ENABLE ROW LEVEL SECURITY;

-- Policies for lumbar_punctures
DROP POLICY IF EXISTS "Residents manage own lumbar punctures" ON lumbar_punctures;
CREATE POLICY "Residents manage own lumbar punctures" ON lumbar_punctures
  FOR ALL USING (auth.uid() = resident_id) WITH CHECK (auth.uid() = resident_id);

DROP POLICY IF EXISTS "Admins manage all lumbar punctures" ON lumbar_punctures;
CREATE POLICY "Admins manage all lumbar punctures" ON lumbar_punctures
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies for CSF analysis
DROP POLICY IF EXISTS "Users access own CSF results" ON csf_analysis_results;
CREATE POLICY "Users access own CSF results" ON csf_analysis_results
  FOR ALL USING (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  )
  WITH CHECK (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

-- Policies for complications
DROP POLICY IF EXISTS "Users access own complications" ON lp_complications;
CREATE POLICY "Users access own complications" ON lp_complications
  FOR ALL USING (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  )
  WITH CHECK (
    lumbar_puncture_id IN (
      SELECT id FROM lumbar_punctures WHERE resident_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_lumbar_punctures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_lumbar_punctures_updated_at ON lumbar_punctures;
CREATE TRIGGER tr_lumbar_punctures_updated_at
  BEFORE UPDATE ON lumbar_punctures
  FOR EACH ROW
  EXECUTE FUNCTION update_lumbar_punctures_updated_at();

-- Function to calculate success rate for a resident
CREATE OR REPLACE FUNCTION get_resident_lp_stats(resident_uuid UUID)
RETURNS TABLE (
  total_procedures INTEGER,
  successful_procedures INTEGER,
  success_rate DECIMAL(5,2),
  complications_count INTEGER,
  average_attempts DECIMAL(3,1),
  most_common_indication TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_procedures,
    COUNT(*) FILTER (WHERE successful = true)::INTEGER as successful_procedures,
    ROUND(
      (COUNT(*) FILTER (WHERE successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    (SELECT COUNT(*)::INTEGER
     FROM lp_complications lc
     JOIN lumbar_punctures lp ON lc.lumbar_puncture_id = lp.id
     WHERE lp.resident_id = resident_uuid
    ) as complications_count,
    ROUND(AVG(attempts_count)::DECIMAL, 1) as average_attempts,
    (SELECT indication
     FROM lumbar_punctures
     WHERE resident_id = resident_uuid
     GROUP BY indication
     ORDER BY COUNT(*) DESC
     LIMIT 1
    ) as most_common_indication
  FROM lumbar_punctures
  WHERE resident_id = resident_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly LP statistics
CREATE OR REPLACE FUNCTION get_monthly_lp_stats(resident_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
  month_year TEXT,
  total_lps INTEGER,
  successful_lps INTEGER,
  success_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(procedure_date, 'YYYY-MM') as month_year,
    COUNT(*)::INTEGER as total_lps,
    COUNT(*) FILTER (WHERE successful = true)::INTEGER as successful_lps,
    ROUND(
      (COUNT(*) FILTER (WHERE successful = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate
  FROM lumbar_punctures
  WHERE resident_id = resident_uuid
    AND procedure_date BETWEEN start_date AND end_date
  GROUP BY TO_CHAR(procedure_date, 'YYYY-MM')
  ORDER BY month_year;
END;
$$ LANGUAGE plpgsql;