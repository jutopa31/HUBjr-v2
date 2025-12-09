-- Ensure interconsultas has the relato_consulta column and refresh the API schema cache
-- Run in Supabase SQL Editor

alter table if exists public.interconsultas
  add column if not exists relato_consulta text null;

comment on column public.interconsultas.relato_consulta is 'Relato libre de la interconsulta';

-- Force PostgREST/Supabase to pick up the column in the schema cache
notify pgrst, 'reload schema';
