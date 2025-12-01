-- Add image link fields for ward round patients (thumbnails + full-size)
ALTER TABLE ward_round_patients
  ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS image_full_url TEXT;

COMMENT ON COLUMN ward_round_patients.image_thumbnail_url IS 'URL de miniatura o vista previa de la imagen del paciente (opcional)';
COMMENT ON COLUMN ward_round_patients.image_full_url IS 'URL directo a la imagen completa del paciente (para ampliación)';
