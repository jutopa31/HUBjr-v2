-- Agregar campos de imágenes a tabla interconsultas
-- Mismo patrón que ward_round_patients para consistencia

-- Arrays de URLs de imágenes (mismo patrón que ward_round_patients)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_full_url TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exa_url TEXT[] DEFAULT '{}';

-- Columna para texto OCR extraído de estudios
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS estudios_ocr TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN public.interconsultas.image_thumbnail_url IS 'URLs de miniaturas de imágenes subidas';
COMMENT ON COLUMN public.interconsultas.image_full_url IS 'URLs de imágenes en tamaño completo';
COMMENT ON COLUMN public.interconsultas.exa_url IS 'URLs del visor EXA institucional';
COMMENT ON COLUMN public.interconsultas.estudios_ocr IS 'Texto extraído de PDFs/imágenes mediante OCR';
