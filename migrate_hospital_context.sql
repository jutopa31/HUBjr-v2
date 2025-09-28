-- Script de migración para agregar contexto de hospital
-- Agregar campo hospital_context a la tabla diagnostic_assessments
-- Ejecutar este script en Supabase SQL Editor

-- 1. Agregar la columna hospital_context con valor por defecto 'Posadas'
ALTER TABLE diagnostic_assessments
ADD COLUMN hospital_context VARCHAR(20) DEFAULT 'Posadas';

-- 2. Actualizar todos los registros existentes para que tengan contexto 'Posadas'
UPDATE diagnostic_assessments
SET hospital_context = 'Posadas'
WHERE hospital_context IS NULL;

-- 3. Agregar restricción para asegurar que solo acepta valores válidos
ALTER TABLE diagnostic_assessments
ADD CONSTRAINT check_hospital_context
CHECK (hospital_context IN ('Posadas', 'Julian'));

-- 4. Crear índice para mejorar performance de queries filtradas por hospital
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_hospital_context
ON diagnostic_assessments(hospital_context);

-- 5. Verificar que la migración fue exitosa
SELECT
    hospital_context,
    COUNT(*) as count
FROM diagnostic_assessments
GROUP BY hospital_context;

-- Script completado ✅
-- Todos los registros existentes quedarán como 'Posadas' por defecto
-- Los nuevos registros podrán especificar 'Posadas' o 'Julian'