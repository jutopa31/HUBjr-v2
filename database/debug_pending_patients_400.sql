-- =====================================================
-- DIAGNÓSTICO DE ERROR 400 EN PENDING_PATIENTS
-- Verificar constraints y estructura de tabla
-- =====================================================

-- 1. Ver todos los constraints de la tabla
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'pending_patients'::regclass
ORDER BY contype, conname;

-- 2. Ver todas las columnas y sus propiedades
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'pending_patients'
ORDER BY ordinal_position;

-- 3. Verificar el constraint de resolved (puede causar 400)
-- Este constraint requiere que si resolved=TRUE, debe tener final_diagnosis
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%pending_patients%';

-- 4. TEST: Intentar insertar un paciente mínimo para ver qué falla
-- Descomenta para probar:
/*
INSERT INTO pending_patients (
    patient_name,
    chief_complaint,
    clinical_notes,
    created_by,
    hospital_context
) VALUES (
    'Test Patient',
    'Test Complaint',
    'Test Notes',
    'test@example.com',
    'Posadas'
);
*/

-- 5. Ver el último error de inserción (si existe)
-- Esto requiere tener pg_stat_statements habilitado
-- SELECT query, calls, mean_exec_time, stddev_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%pending_patients%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 5;

-- =====================================================
-- POSIBLE FIX: Remover el constraint problemático
-- =====================================================

-- Si el constraint de resolved_diagnosis_check está causando problemas:
-- ALTER TABLE pending_patients DROP CONSTRAINT IF EXISTS resolved_diagnosis_check;

-- O modificarlo para ser menos estricto:
/*
ALTER TABLE pending_patients DROP CONSTRAINT IF EXISTS resolved_diagnosis_check;

ALTER TABLE pending_patients ADD CONSTRAINT resolved_diagnosis_check CHECK (
  (resolved = FALSE) OR
  (resolved = TRUE AND final_diagnosis IS NOT NULL AND final_diagnosis != '')
);
*/
