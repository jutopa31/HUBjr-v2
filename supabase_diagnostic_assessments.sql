-- SQL para crear tabla diagnostic_assessments en Supabase
-- Tabla para almacenar evaluaciones diagnósticas de pacientes

CREATE TABLE diagnostic_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_name VARCHAR NOT NULL,
    patient_age VARCHAR,
    patient_dni VARCHAR,
    clinical_notes TEXT NOT NULL,
    scale_results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR DEFAULT 'neurologist',
    status VARCHAR DEFAULT 'active'
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_diagnostic_assessments_created_at ON diagnostic_assessments(created_at);
CREATE INDEX idx_diagnostic_assessments_patient_name ON diagnostic_assessments(patient_name);
CREATE INDEX idx_diagnostic_assessments_created_by ON diagnostic_assessments(created_by);

-- Habilitar Row Level Security (RLS)
ALTER TABLE diagnostic_assessments ENABLE ROW LEVEL SECURITY;

-- Política básica para permitir operaciones CRUD (ajustar según necesidades de seguridad)
CREATE POLICY "Enable read access for all users" ON diagnostic_assessments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON diagnostic_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON diagnostic_assessments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON diagnostic_assessments FOR DELETE USING (true);

-- Comentarios para documentar la tabla
COMMENT ON TABLE diagnostic_assessments IS 'Tabla para almacenar evaluaciones diagnósticas realizadas en el módulo de Algoritmos Diagnósticos';
COMMENT ON COLUMN diagnostic_assessments.id IS 'ID único del registro';
COMMENT ON COLUMN diagnostic_assessments.patient_name IS 'Nombre del paciente';
COMMENT ON COLUMN diagnostic_assessments.patient_age IS 'Edad del paciente';
COMMENT ON COLUMN diagnostic_assessments.patient_dni IS 'DNI del paciente (opcional)';
COMMENT ON COLUMN diagnostic_assessments.clinical_notes IS 'Notas clínicas completas del paciente';
COMMENT ON COLUMN diagnostic_assessments.scale_results IS 'Resultados de escalas aplicadas en formato JSON';
COMMENT ON COLUMN diagnostic_assessments.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN diagnostic_assessments.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN diagnostic_assessments.status IS 'Estado del registro (active, archived, etc.)';