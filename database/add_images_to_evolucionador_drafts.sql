-- Add image columns to evolucionador_drafts table for auto-save support
-- Migration created: 2025-12-22

-- Add image columns for draft auto-save
ALTER TABLE public.evolucionador_drafts
  ADD COLUMN IF NOT EXISTS image_thumbnail_url JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_full_url JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exa_url JSONB DEFAULT '[]'::jsonb;

-- Add documentation comments
COMMENT ON COLUMN public.evolucionador_drafts.image_thumbnail_url IS 'Miniaturas de imágenes en borrador (auto-guardado)';
COMMENT ON COLUMN public.evolucionador_drafts.image_full_url IS 'Imágenes completas en borrador (auto-guardado)';
COMMENT ON COLUMN public.evolucionador_drafts.exa_url IS 'URLs EXA en borrador (auto-guardado)';

-- Note: Existing RLS policies automatically cover these new columns
