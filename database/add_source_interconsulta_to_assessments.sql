-- Agregar tracking de interconsulta origen en diagnostic_assessments
-- Permite trazabilidad desde Interconsultas → Evolucionador → Pase de Sala

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
