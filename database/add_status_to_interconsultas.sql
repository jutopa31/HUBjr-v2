-- Add status column to interconsultas table
-- Execute in Supabase SQL Editor
-- This migration adds status tracking to the interconsultas system

-- Add status column with default value
ALTER TABLE interconsultas
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Pendiente';

-- Add check constraint to ensure only valid status values
ALTER TABLE interconsultas
ADD CONSTRAINT interconsultas_status_check
CHECK (status IN ('Pendiente', 'En Proceso', 'Resuelta', 'Cancelada'));

-- Add index for filtering performance
CREATE INDEX IF NOT EXISTS idx_interconsultas_status ON interconsultas(status);

-- Update existing records to set status based on respuesta field
-- If there's a response, set status to 'En Proceso', otherwise 'Pendiente'
UPDATE interconsultas
SET status = CASE
  WHEN respuesta IS NOT NULL AND respuesta != '' THEN 'En Proceso'
  ELSE 'Pendiente'
END
WHERE status = 'Pendiente'; -- Only update records that have the default value

-- Add comment for documentation
COMMENT ON COLUMN interconsultas.status IS 'Estado de la interconsulta: Pendiente, En Proceso, Resuelta, Cancelada';
