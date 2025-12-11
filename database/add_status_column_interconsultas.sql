-- Agregar columna status a tabla interconsultas
-- Este campo está siendo usado en el código pero no existe en la base de datos

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
