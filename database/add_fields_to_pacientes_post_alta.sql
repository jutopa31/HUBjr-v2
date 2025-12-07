-- Add telefono and notas_evolucion columns to pacientes_post_alta table
-- Execute in Supabase SQL Editor
-- This migration adds additional tracking fields for post-discharge patients

-- Add telefono column for patient contact
ALTER TABLE pacientes_post_alta
ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);

-- Add notas_evolucion column for ambulatory visit notes
ALTER TABLE pacientes_post_alta
ADD COLUMN IF NOT EXISTS notas_evolucion TEXT;

-- Add comments for documentation
COMMENT ON COLUMN pacientes_post_alta.telefono IS 'Teléfono de contacto del paciente (opcional)';
COMMENT ON COLUMN pacientes_post_alta.notas_evolucion IS 'Notas sobre la evolución del paciente en visitas ambulatorias (opcional)';

-- Note: No indices needed for these fields as they're not used for filtering
-- The existing updated_at trigger will handle automatic timestamp updates
