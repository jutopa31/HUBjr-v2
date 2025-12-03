-- Migración: Convertir columnas de imagen de TEXT a JSONB arrays
-- Fecha: 2025-12-03
-- Propósito: Permitir múltiples imágenes por paciente en Ward Rounds

-- Paso 1: Cambiar tipos de columna de TEXT a JSONB arrays
-- Los valores existentes (strings) se convierten automáticamente a arrays de un elemento
-- Los valores NULL o vacíos se convierten en arrays vacíos []

ALTER TABLE ward_round_patients
  ALTER COLUMN image_thumbnail_url TYPE JSONB USING
    CASE
      WHEN image_thumbnail_url IS NULL OR image_thumbnail_url = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(image_thumbnail_url)
    END,
  ALTER COLUMN image_full_url TYPE JSONB USING
    CASE
      WHEN image_full_url IS NULL OR image_full_url = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(image_full_url)
    END,
  ALTER COLUMN exa_url TYPE JSONB USING
    CASE
      WHEN exa_url IS NULL OR exa_url = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(exa_url)
    END;

-- Paso 2: Actualizar comentarios de columnas para documentación
COMMENT ON COLUMN ward_round_patients.image_thumbnail_url IS 'JSONB array of thumbnail URLs for patient images';
COMMENT ON COLUMN ward_round_patients.image_full_url IS 'JSONB array of full-size image URLs';
COMMENT ON COLUMN ward_round_patients.exa_url IS 'JSONB array of EXA viewer URLs (nullable entries)';

-- Paso 3: Crear función helper para agregar imágenes fácilmente desde la aplicación
-- Uso: SELECT add_patient_image('patient-uuid', 'thumb-url', 'full-url', 'exa-url-opcional');
CREATE OR REPLACE FUNCTION add_patient_image(
  patient_id UUID,
  thumb_url TEXT,
  full_url TEXT,
  exa_url_param TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE ward_round_patients
  SET
    image_thumbnail_url = image_thumbnail_url || jsonb_build_array(thumb_url),
    image_full_url = image_full_url || jsonb_build_array(full_url),
    exa_url = CASE
      WHEN exa_url_param IS NOT NULL THEN exa_url || jsonb_build_array(exa_url_param)
      ELSE exa_url || 'null'::jsonb
    END,
    updated_at = NOW()
  WHERE id = patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_patient_image IS 'Helper function to append a new image to patient image arrays. Updates updated_at timestamp automatically.';

-- Verificación: Query para revisar la migración
-- Ejecutar después de aplicar la migración para verificar que funcionó correctamente
-- SELECT id, nombre,
--        jsonb_array_length(image_thumbnail_url) as num_thumbnails,
--        jsonb_array_length(image_full_url) as num_full_images,
--        jsonb_array_length(exa_url) as num_exa_urls
-- FROM ward_round_patients
-- WHERE jsonb_array_length(image_thumbnail_url) > 0
-- LIMIT 10;
