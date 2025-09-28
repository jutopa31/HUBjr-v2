-- Agregar columna 'pendientes' a la tabla ward_round_patients
-- Ejecutar este SQL en el panel de Supabase SQL Editor

ALTER TABLE ward_round_patients 
ADD COLUMN pendientes TEXT;

-- Opcional: Agregar un comentario para documentar la columna
COMMENT ON COLUMN ward_round_patients.pendientes IS 'Campo para almacenar pendientes del paciente (estudios, interconsultas, seguimientos, etc.)';