-- Migración: Agregar soporte para videos en ward_round_patients
-- Fecha: 2025-12-27
-- Propósito: Permitir almacenar URLs de videos junto con imágenes en Ward Rounds

-- Agregar columna video_url como JSONB array (consistente con image_full_url)
ALTER TABLE ward_round_patients
  ADD COLUMN IF NOT EXISTS video_url JSONB DEFAULT '[]'::jsonb;

-- Actualizar comentario de columna para documentación
COMMENT ON COLUMN ward_round_patients.video_url IS 'JSONB array of video URLs (mp4, webm, etc.) for patient multimedia';

-- Función helper para agregar videos fácilmente desde la aplicación
-- Uso: SELECT add_patient_video('patient-uuid', 'video-url');
CREATE OR REPLACE FUNCTION add_patient_video(
  patient_id UUID,
  new_video_url TEXT
) RETURNS void AS $$
BEGIN
  UPDATE ward_round_patients
  SET
    video_url = video_url || jsonb_build_array(new_video_url),
    updated_at = NOW()
  WHERE id = patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_patient_video IS 'Helper function to append a new video URL to patient video array. Updates updated_at timestamp automatically.';

-- Verificación: Query para revisar que se agregó correctamente
-- Ejecutar después de aplicar la migración
-- SELECT id, nombre, video_url, jsonb_array_length(video_url) as num_videos
-- FROM ward_round_patients
-- LIMIT 10;
