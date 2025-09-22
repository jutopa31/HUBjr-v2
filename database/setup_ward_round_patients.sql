-- Database setup for ward_round_patients table
-- Execute this in Supabase SQL Editor

-- Create the main ward_round_patients table
CREATE TABLE IF NOT EXISTS ward_round_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cama VARCHAR NOT NULL,
  dni VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  edad VARCHAR NOT NULL,
  antecedentes TEXT,
  motivo_consulta TEXT,
  examen_fisico TEXT,
  estudios TEXT,
  severidad VARCHAR,
  diagnostico TEXT,
  plan TEXT,
  pendientes TEXT,
  fecha DATE NOT NULL,
  assigned_resident_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_dni ON ward_round_patients(dni);
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_fecha ON ward_round_patients(fecha);
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_assigned_resident ON ward_round_patients(assigned_resident_id);
CREATE INDEX IF NOT EXISTS idx_ward_round_patients_created_at ON ward_round_patients(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE ward_round_patients ENABLE ROW LEVEL SECURITY;

-- Policy to allow reads for assigned residents or unassigned patients
CREATE POLICY "Enable read for assigned residents" ON ward_round_patients
  FOR SELECT USING (
    assigned_resident_id = auth.uid() OR
    assigned_resident_id IS NULL
  );

-- Policy to allow inserts for authenticated users
CREATE POLICY "Enable insert for all authenticated users" ON ward_round_patients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow updates for authenticated users
CREATE POLICY "Enable update for all authenticated users" ON ward_round_patients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy to allow deletes for authenticated users
CREATE POLICY "Enable delete for all authenticated users" ON ward_round_patients
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_ward_round_patients_updated_at
  BEFORE UPDATE ON ward_round_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE ward_round_patients IS 'Table for storing patient information during ward rounds';
COMMENT ON COLUMN ward_round_patients.pendientes IS 'Field for storing pending tasks for the patient (studies, consultations, follow-ups, etc.)';