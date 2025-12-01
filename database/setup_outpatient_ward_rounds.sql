-- Database setup for outpatient_ward_rounds table (Pase de Sala Ambulatorios)
-- Execute this in Supabase SQL Editor
-- This table is for outpatient follow-up with pending tasks/appointments

-- Create the outpatient_ward_rounds table
CREATE TABLE IF NOT EXISTS outpatient_ward_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- No 'cama' field - outpatients don't have bed assignment
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

  -- Additional fields specific to outpatients
  fecha_proxima_cita DATE,  -- Next appointment date
  estado_pendiente VARCHAR DEFAULT 'pendiente',  -- 'pendiente', 'resuelto', 'en_proceso'
  pendientes TEXT,  -- Detailed pending tasks

  -- Standard metadata
  fecha DATE NOT NULL,  -- Date of this record
  assigned_resident_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_dni ON outpatient_ward_rounds(dni);
CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_fecha ON outpatient_ward_rounds(fecha);
CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_fecha_proxima_cita ON outpatient_ward_rounds(fecha_proxima_cita);
CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_estado_pendiente ON outpatient_ward_rounds(estado_pendiente);
CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_assigned_resident ON outpatient_ward_rounds(assigned_resident_id);
CREATE INDEX IF NOT EXISTS idx_outpatient_ward_rounds_created_at ON outpatient_ward_rounds(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE outpatient_ward_rounds ENABLE ROW LEVEL SECURITY;

-- Policy to allow reads for assigned residents or unassigned patients
CREATE POLICY "Enable read for assigned residents" ON outpatient_ward_rounds
  FOR SELECT USING (
    assigned_resident_id = auth.uid() OR
    assigned_resident_id IS NULL
  );

-- Policy to allow inserts for authenticated users
CREATE POLICY "Enable insert for all authenticated users" ON outpatient_ward_rounds
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow updates for authenticated users
CREATE POLICY "Enable update for all authenticated users" ON outpatient_ward_rounds
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy to allow deletes for authenticated users
CREATE POLICY "Enable delete for all authenticated users" ON outpatient_ward_rounds
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger (drop first if exists to avoid errors on re-run)
DROP TRIGGER IF EXISTS update_outpatient_ward_rounds_updated_at ON outpatient_ward_rounds;

CREATE TRIGGER update_outpatient_ward_rounds_updated_at
  BEFORE UPDATE ON outpatient_ward_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE outpatient_ward_rounds IS 'Table for storing outpatient follow-up information with pending appointments and tasks';
COMMENT ON COLUMN outpatient_ward_rounds.fecha_proxima_cita IS 'Date of next scheduled appointment for the patient';
COMMENT ON COLUMN outpatient_ward_rounds.estado_pendiente IS 'Status of pending tasks: pendiente, en_proceso, resuelto';
COMMENT ON COLUMN outpatient_ward_rounds.pendientes IS 'Detailed description of pending tasks, studies, consultations, etc.';

-- Optional: Create a view to see upcoming appointments
CREATE OR REPLACE VIEW upcoming_outpatient_appointments AS
SELECT
  id,
  nombre,
  dni,
  fecha_proxima_cita,
  estado_pendiente,
  pendientes,
  diagnostico,
  assigned_resident_id,
  (fecha_proxima_cita - CURRENT_DATE) as dias_hasta_cita
FROM outpatient_ward_rounds
WHERE
  fecha_proxima_cita >= CURRENT_DATE
  AND estado_pendiente != 'resuelto'
ORDER BY fecha_proxima_cita ASC;

COMMENT ON VIEW upcoming_outpatient_appointments IS 'View showing upcoming outpatient appointments with pending tasks';
