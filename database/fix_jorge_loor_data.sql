-- Script de migración para corregir datos de Jorge Elias Loor
-- Este script es IDEMPOTENTE - puede ejecutarse múltiples veces sin problemas
-- Ejecuta esto en tu Supabase SQL Editor si ya ejecutaste real_residents_setup.sql

-- ============================================================================
-- PASO 1: Verificar si existe el registro con el email incorrecto
-- ============================================================================

DO $$
BEGIN
  -- Mostrar estado actual antes de la corrección
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN PREVIA';
  RAISE NOTICE '========================================';

  IF EXISTS (SELECT 1 FROM resident_profiles WHERE email = 'juan.elias.loor@gmail.com') THEN
    RAISE NOTICE 'Se encontró registro con email incorrecto: juan.elias.loor@gmail.com';
  ELSE
    RAISE NOTICE 'No se encontró registro con email incorrecto';
  END IF;

  IF EXISTS (SELECT 1 FROM resident_profiles WHERE email = 'jorge.elias.loor@gmail.com') THEN
    RAISE NOTICE 'Ya existe registro con email correcto: jorge.elias.loor@gmail.com';
  ELSE
    RAISE NOTICE 'No existe registro con email correcto aún';
  END IF;
END $$;

-- ============================================================================
-- PASO 2: Actualizar tabla resident_profiles
-- ============================================================================

UPDATE resident_profiles
SET
  first_name = 'Jorge Elias',
  email = 'jorge.elias.loor@gmail.com',
  updated_at = NOW()
WHERE email = 'juan.elias.loor@gmail.com';

-- ============================================================================
-- PASO 3: Actualizar auth.users (si existe)
-- ============================================================================
-- NOTA: Este UPDATE puede fallar si no tienes permisos de admin en auth.users
-- o si el usuario no existe. El error se captura y no afecta el resto del script.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'juan.elias.loor@gmail.com') THEN
    UPDATE auth.users
    SET
      email = 'jorge.elias.loor@gmail.com',
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{full_name}',
        '"Jorge Elias Loor"'
      )
    WHERE email = 'juan.elias.loor@gmail.com';

    RAISE NOTICE 'Usuario actualizado en auth.users';
  ELSE
    RAISE NOTICE 'No se encontró usuario en auth.users con el email incorrecto';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No tienes permisos para actualizar auth.users - ejecuta esto como admin de Supabase';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar auth.users: %', SQLERRM;
END $$;

-- ============================================================================
-- PASO 4: Actualizar diagnostic_assessments (campo created_by si usa email)
-- ============================================================================

-- La tabla diagnostic_assessments tiene un campo created_by que puede contener
-- el email del residente. Actualizarlo si existe.
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE diagnostic_assessments
  SET created_by = 'jorge.elias.loor@gmail.com'
  WHERE created_by = 'juan.elias.loor@gmail.com';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RAISE NOTICE 'Actualizado % registros en diagnostic_assessments', v_updated;
  ELSE
    RAISE NOTICE 'No se encontraron registros en diagnostic_assessments con el email antiguo';
  END IF;
END $$;

-- NOTA: Las tablas ward_round_patients e interconsultas usan UUIDs (assigned_resident_id, user_id)
-- que referencian auth.users(id). Al actualizar el email en auth.users, las referencias
-- por UUID se mantienen automáticamente. No es necesario actualizar estas tablas.

-- ============================================================================
-- PASO 5: Verificación final
-- ============================================================================

DO $$
DECLARE
  v_count_old INTEGER;
  v_count_new INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL';
  RAISE NOTICE '========================================';

  -- Contar registros con email antiguo
  SELECT COUNT(*) INTO v_count_old
  FROM resident_profiles
  WHERE email = 'juan.elias.loor@gmail.com';

  -- Contar registros con email nuevo
  SELECT COUNT(*) INTO v_count_new
  FROM resident_profiles
  WHERE email = 'jorge.elias.loor@gmail.com';

  RAISE NOTICE 'Registros con email antiguo (juan): %', v_count_old;
  RAISE NOTICE 'Registros con email nuevo (jorge): %', v_count_new;

  IF v_count_old = 0 AND v_count_new = 1 THEN
    RAISE NOTICE '✅ MIGRACIÓN EXITOSA';
  ELSIF v_count_old = 0 AND v_count_new = 0 THEN
    RAISE NOTICE '⚠️  No se encontró ningún registro (quizás no se ejecutó real_residents_setup.sql aún)';
  ELSE
    RAISE NOTICE '⚠️  Estado inesperado - verifica manualmente';
  END IF;
END $$;

-- Mostrar el registro actualizado
SELECT
  first_name || ' ' || last_name as nombre_completo,
  email,
  training_level,
  current_rotation,
  status,
  user_id,
  updated_at
FROM resident_profiles
WHERE email = 'jorge.elias.loor@gmail.com'
   OR email = 'juan.elias.loor@gmail.com';
