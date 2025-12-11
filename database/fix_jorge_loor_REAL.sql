-- Script de corrección para Jorge Elias Loor Vera
-- Email correcto: eliasloor98@gmail.com
-- Este es el script CORRECTO que actualiza el registro real

-- ============================================================================
-- VERIFICACIÓN PREVIA
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ESTADO ACTUAL DEL RESIDENTE';
  RAISE NOTICE '========================================';
END $$;

SELECT
  first_name || ' ' || last_name as nombre_actual,
  email,
  training_level,
  user_id
FROM resident_profiles
WHERE email = 'eliasloor98@gmail.com';

-- ============================================================================
-- ACTUALIZACIÓN DEL NOMBRE
-- ============================================================================

UPDATE resident_profiles
SET
  first_name = 'Jorge Elias',
  last_name = 'Loor Vera',
  updated_at = NOW()
WHERE email = 'eliasloor98@gmail.com';

-- ============================================================================
-- ACTUALIZAR auth.users (metadata)
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtener el user_id del residente
  SELECT user_id INTO v_user_id
  FROM resident_profiles
  WHERE email = 'eliasloor98@gmail.com';

  -- Actualizar metadata en auth.users si existe
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      '"Jorge Elias Loor Vera"'
    )
    WHERE id = v_user_id;

    RAISE NOTICE 'Metadata actualizado en auth.users para user_id: %', v_user_id;
  ELSE
    RAISE NOTICE 'No se encontró user_id para actualizar auth.users';
  END IF;

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No tienes permisos para actualizar auth.users - ejecuta como admin';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar auth.users: %', SQLERRM;
END $$;

-- ============================================================================
-- ACTUALIZAR diagnostic_assessments si existe
-- ============================================================================
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE diagnostic_assessments
  SET created_by = 'eliasloor98@gmail.com'
  WHERE created_by LIKE '%juan%loor%' OR created_by LIKE '%elias%';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RAISE NOTICE 'Actualizado % registros en diagnostic_assessments', v_updated;
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL';
  RAISE NOTICE '========================================';
END $$;

SELECT
  '✅ RESIDENT_PROFILES ACTUALIZADO' as status,
  first_name || ' ' || last_name as nombre_correcto,
  email,
  training_level,
  updated_at
FROM resident_profiles
WHERE email = 'eliasloor98@gmail.com';

-- Verificar pacientes asignados (deben mostrar el nuevo nombre)
SELECT
  '✅ PACIENTES ASIGNADOS' as status,
  wrp.nombre as paciente,
  wrp.cama,
  rp.first_name || ' ' || rp.last_name as residente_asignado,
  wrp.fecha
FROM ward_round_patients wrp
LEFT JOIN resident_profiles rp ON rp.user_id = wrp.assigned_resident_id
WHERE rp.email = 'eliasloor98@gmail.com'
ORDER BY wrp.fecha DESC
LIMIT 5;
