-- Borradores del Evolucionador (autosave multi-dispositivo)
create table if not exists public.evolucionador_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  notes text not null default '',
  patient_name text,
  patient_dni text,
  patient_age text,
  patient_bed text,
  source_interconsulta_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evolucionador_drafts_user_id_idx
  on public.evolucionador_drafts (user_id);

create index if not exists evolucionador_drafts_updated_at_idx
  on public.evolucionador_drafts (updated_at desc);

alter table public.evolucionador_drafts enable row level security;

create policy "Evolucionador drafts are visible to owner"
  on public.evolucionador_drafts
  for select
  using (auth.uid() = user_id);

create policy "Evolucionador drafts are insertable by owner"
  on public.evolucionador_drafts
  for insert
  with check (auth.uid() = user_id);

create policy "Evolucionador drafts are updatable by owner"
  on public.evolucionador_drafts
  for update
  using (auth.uid() = user_id);

create policy "Evolucionador drafts are deletable by owner"
  on public.evolucionador_drafts
  for delete
  using (auth.uid() = user_id);
