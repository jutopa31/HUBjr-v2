-- Script para conectar perfiles con usuarios reales de auth.users
-- Ejecuta esto DESPUÉS de crear la tabla resident_profiles

-- PASO 1: Ver los usuarios reales de auth.users
SELECT
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email LIKE '%julian.martin.alonso%'
   OR email LIKE '%tatianachamu11%'
   OR email LIKE '%serena%'
   OR email LIKE '%juan%'
   OR email LIKE '%jaqueline%'
   OR email LIKE '%molina%'
ORDER BY email;

-- PASO 2: Después de ver los resultados arriba, ejecuta estas actualizaciones
-- Reemplaza los UUIDs con los IDs reales de la consulta anterior

-- EJEMPLO de cómo actualizar (REEMPLAZA LOS UUIDs CON LOS REALES):
/*
UPDATE resident_profiles
SET user_id = 'UUID_REAL_DE_JULIAN_AQUI'
WHERE email = 'julian.martin.alonso@gmail.com';

UPDATE resident_profiles
SET user_id = 'UUID_REAL_DE_TATIANA_AQUI'
WHERE email = 'tatianachamu11@gmail.com';

UPDATE resident_profiles
SET user_id = 'UUID_REAL_DE_SERENA_AQUI'
WHERE email = 'serena.angulo@gmail.com';

UPDATE resident_profiles
SET user_id = 'UUID_REAL_DE_JORGE_AQUI'
WHERE email = 'eliasloor98@gmail.com';

UPDATE resident_profiles
SET user_id = 'UUID_REAL_DE_JAQUELINE_AQUI'
WHERE email = 'jaqueline.molina@gmail.com';
*/

-- PASO 3: Verificar que la conexión funcionó
SELECT
  rp.first_name || ' ' || rp.last_name as nombre_completo,
  rp.email,
  rp.training_level,
  rp.user_id,
  au.email as auth_email
FROM resident_profiles rp
LEFT JOIN auth.users au ON rp.user_id = au.id
WHERE rp.status = 'active'
ORDER BY rp.training_level;

-- PASO 4: Test de la funcionalidad
-- Esta consulta simula lo que hace la aplicación
SELECT
  rp.user_id,
  rp.first_name || ' ' || rp.last_name as full_name,
  rp.email,
  rp.training_level
FROM resident_profiles rp
WHERE rp.status = 'active'
  AND rp.user_id IS NOT NULL
ORDER BY rp.training_level;