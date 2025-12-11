-- ============================================================================
-- WORKFLOW INTEGRATION MIGRATIONS
-- Interconsultas → Evolucionador → Pase de Sala
-- ============================================================================
-- Execute this file in Supabase SQL Editor to apply all workflow integration changes
-- Created: 2025-12-11
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add status column to interconsultas
-- ============================================================================

-- Agregar columna status (actualmente usada en código pero no existe en BD)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pendiente';

-- Actualizar registros existentes sin status
UPDATE public.interconsultas
SET status = CASE
  WHEN respuesta IS NOT NULL AND respuesta != '' THEN 'En Proceso'
  ELSE 'Pendiente'
END
WHERE status IS NULL;

-- Índice para filtrado rápido por status
CREATE INDEX IF NOT EXISTS idx_interconsultas_status
ON public.interconsultas(status);

-- Constraint para validar valores permitidos
ALTER TABLE public.interconsultas
ADD CONSTRAINT check_status_values
CHECK (status IN ('Pendiente', 'En Proceso', 'Resuelta', 'Cancelada'));

-- Comentario descriptivo
COMMENT ON COLUMN public.interconsultas.status IS 'Estado de la interconsulta: Pendiente, En Proceso, Resuelta, Cancelada';

-- ============================================================================
-- MIGRATION 2: Add image fields to interconsultas
-- ============================================================================

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

-- ============================================================================
-- MIGRATION 3: Add source tracking to diagnostic_assessments
-- ============================================================================

-- Tracking de origen desde interconsulta
ALTER TABLE public.diagnostic_assessments
ADD COLUMN IF NOT EXISTS source_interconsulta_id UUID,
ADD COLUMN IF NOT EXISTS response_sent BOOLEAN DEFAULT FALSE;

-- Foreign key para trazabilidad
ALTER TABLE public.diagnostic_assessments
ADD CONSTRAINT fk_source_interconsulta
FOREIGN KEY (source_interconsulta_id)
REFERENCES public.interconsultas(id)
ON DELETE SET NULL;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_assessments_source_interconsulta
ON public.diagnostic_assessments(source_interconsulta_id);

-- Comentarios descriptivos
COMMENT ON COLUMN public.diagnostic_assessments.source_interconsulta_id IS 'ID de interconsulta origen (si aplica)';
COMMENT ON COLUMN public.diagnostic_assessments.response_sent IS 'Indica si se envió respuesta a interconsulta';

-- ============================================================================
-- VERIFICATION QUERIES (optional - comment out if not needed)
-- ============================================================================

-- Verify interconsultas columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'interconsultas'
  AND column_name IN ('status', 'image_thumbnail_url', 'image_full_url', 'exa_url', 'estudios_ocr')
ORDER BY column_name;

-- Verify diagnostic_assessments columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'diagnostic_assessments'
  AND column_name IN ('source_interconsulta_id', 'response_sent')
ORDER BY column_name;

-- Verify constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.interconsultas'::regclass
  AND conname = 'check_status_values';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Workflow integration migrations completed successfully!';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - interconsultas: status, image fields, estudios_ocr';
  RAISE NOTICE '  - diagnostic_assessments: source_interconsulta_id, response_sent';
END $$;
