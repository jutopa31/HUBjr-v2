-- ============================================================
-- Migration: Add 'ambulatorio' destination to patients_v3
-- ============================================================
-- Run this if the patients_v3 table already exists
-- ============================================================

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE patients_v3
DROP CONSTRAINT IF EXISTS patients_v3_current_destination_check;

-- Step 2: Add new CHECK constraint with 'ambulatorio'
ALTER TABLE patients_v3
ADD CONSTRAINT patients_v3_current_destination_check
CHECK (current_destination IN ('interconsulta', 'pase_sala', 'post_alta', 'ambulatorio'));

-- Step 3: Update the view for destination counts
CREATE OR REPLACE VIEW patients_v3_destination_counts AS
SELECT
  hospital_context,
  COUNT(*) FILTER (WHERE current_destination = 'interconsulta') AS interconsulta_count,
  COUNT(*) FILTER (WHERE current_destination = 'pase_sala') AS pase_sala_count,
  COUNT(*) FILTER (WHERE current_destination = 'post_alta') AS post_alta_count,
  COUNT(*) FILTER (WHERE current_destination = 'ambulatorio') AS ambulatorio_count,
  COUNT(*) AS total_count
FROM patients_v3
GROUP BY hospital_context;

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'patients_v3'::regclass AND contype = 'c';
