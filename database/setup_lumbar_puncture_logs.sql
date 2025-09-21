-- Table to track lumbar puncture procedures per resident
CREATE TABLE IF NOT EXISTS resident_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  residency_year INTEGER CHECK (residency_year BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lumbar_puncture_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES resident_profiles(id) ON DELETE CASCADE,
  patient_initials TEXT NOT NULL CHECK (char_length(patient_initials) <= 3),
  procedure_date DATE NOT NULL,
  supervisor TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lumbar_puncture_logs_resident_id
  ON lumbar_puncture_logs(resident_id);

CREATE INDEX IF NOT EXISTS idx_lumbar_puncture_logs_procedure_date
  ON lumbar_puncture_logs(procedure_date);

ALTER TABLE lumbar_puncture_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Residents manage own lumbar logs" ON lumbar_puncture_logs;
CREATE POLICY "Residents manage own lumbar logs" ON lumbar_puncture_logs
  FOR ALL USING (auth.uid() = resident_id) WITH CHECK (auth.uid() = resident_id);

DROP POLICY IF EXISTS "Admins manage all lumbar logs" ON lumbar_puncture_logs;
CREATE POLICY "Admins manage all lumbar logs" ON lumbar_puncture_logs
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT id FROM resident_profiles WHERE residency_year IS NULL -- placeholder for admins
    )
  );

CREATE OR REPLACE FUNCTION update_lumbar_puncture_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_lumbar_puncture_updated_at ON lumbar_puncture_logs;
CREATE TRIGGER tr_lumbar_puncture_updated_at
  BEFORE UPDATE ON lumbar_puncture_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_lumbar_puncture_updated_at();
