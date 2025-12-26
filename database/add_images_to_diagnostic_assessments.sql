-- Add image columns to diagnostic_assessments table
-- Follows the same pattern as ward_round_patients (JSONB arrays)
-- Migration created: 2025-12-22

-- Add image columns (JSONB arrays)
ALTER TABLE public.diagnostic_assessments
  ADD COLUMN IF NOT EXISTS image_thumbnail_url JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_full_url JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exa_url JSONB DEFAULT '[]'::jsonb;

-- Add documentation comments
COMMENT ON COLUMN public.diagnostic_assessments.image_thumbnail_url IS 'Array JSONB de URLs miniatura de imágenes de pacientes';
COMMENT ON COLUMN public.diagnostic_assessments.image_full_url IS 'Array JSONB de URLs de imágenes en tamaño completo';
COMMENT ON COLUMN public.diagnostic_assessments.exa_url IS 'Array JSONB de URLs del visor EXA institucional (entradas nullable)';

-- Create index for performance on image queries
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_images
  ON public.diagnostic_assessments USING gin (image_thumbnail_url);

-- Note: Existing RLS policies automatically cover these new columns
