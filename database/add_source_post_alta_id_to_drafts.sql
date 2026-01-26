-- Agregar columna source_post_alta_id a evolucionador_drafts
-- Permite vincular borradores con pacientes post-alta (igual que source_interconsulta_id)

ALTER TABLE public.evolucionador_drafts
ADD COLUMN IF NOT EXISTS source_post_alta_id uuid;

-- Crear índice para mejorar búsquedas por post-alta ID
CREATE INDEX IF NOT EXISTS evolucionador_drafts_source_post_alta_id_idx
  ON public.evolucionador_drafts (source_post_alta_id);

-- Comentario explicativo
COMMENT ON COLUMN public.evolucionador_drafts.source_post_alta_id IS
  'ID del paciente post-alta vinculado a este borrador (para recuperar borrador al volver a seleccionar el paciente)';
