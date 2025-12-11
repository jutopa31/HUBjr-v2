-- Script de verificación para confirmar que Jorge Elias Loor está correctamente actualizado
-- Ejecuta esto en Supabase SQL Editor para verificar el estado actual

-- ============================================================================
-- 1. Verificar registro en resident_profiles
-- ============================================================================
SELECT
  '1. RESIDENT_PROFILES' as tabla,
  first_name,
  last_name,
  email,
  training_level,
  user_id,
  updated_at
FROM resident_profiles
WHERE email LIKE '%loor%'
   OR first_name LIKE '%Jorge%'
   OR first_name LIKE '%Juan%';

-- ============================================================================
-- 2. Verificar en auth.users
-- ============================================================================
SELECT
  '2. AUTH.USERS' as tabla,
  id as user_id,
  email,
  raw_user_meta_data->>'full_name' as full_name_metadata,
  created_at,
  updated_at
FROM auth.users
WHERE email LIKE '%loor%';

-- ============================================================================
-- 3. Verificar vistas de ranking (si aplica)
-- ============================================================================
SELECT
  '3. RANKING_LEADERBOARD_WEEKLY' as vista,
  user_id,
  display_name,
  level,
  points
FROM ranking_leaderboard_weekly
WHERE display_name LIKE '%Loor%';

SELECT
  '4. RANKING_LEADERBOARD_MONTHLY' as vista,
  user_id,
  display_name,
  level,
  points
FROM ranking_leaderboard_monthly
WHERE display_name LIKE '%Loor%';

-- ============================================================================
-- 5. Verificar pacientes asignados en ward_round_patients
-- ============================================================================
SELECT
  '5. WARD_ROUND_PATIENTS' as tabla,
  wrp.id,
  wrp.nombre as paciente,
  wrp.cama,
  wrp.fecha,
  wrp.assigned_resident_id,
  rp.first_name || ' ' || rp.last_name as residente_asignado,
  rp.email as residente_email
FROM ward_round_patients wrp
LEFT JOIN resident_profiles rp ON rp.user_id = wrp.assigned_resident_id
WHERE rp.email LIKE '%loor%'
   OR rp.first_name LIKE '%Jorge%'
   OR rp.first_name LIKE '%Juan%'
ORDER BY wrp.fecha DESC
LIMIT 10;

-- ============================================================================
-- 6. Buscar CUALQUIER referencia a "juan.elias.loor" en la BD
-- ============================================================================
SELECT
  '6. DIAGNOSTIC_ASSESSMENTS (created_by)' as tabla,
  COUNT(*) as registros_con_email_antiguo
FROM diagnostic_assessments
WHERE created_by = 'juan.elias.loor@gmail.com';

SELECT
  '7. DIAGNOSTIC_ASSESSMENTS (created_by correcto)' as tabla,
  COUNT(*) as registros_con_email_nuevo
FROM diagnostic_assessments
WHERE created_by = 'jorge.elias.loor@gmail.com';
