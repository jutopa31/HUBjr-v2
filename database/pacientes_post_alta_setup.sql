-- Supabase DDL for `public.pacientes_post_alta`
-- Table for patients scheduled for outpatient visits after hospital discharge

-- Enable UUID generation (if not already enabled)
create extension if not exists pgcrypto;

-- Table
create table if not exists public.pacientes_post_alta (
  id uuid primary key default gen_random_uuid(),
  dni text not null,
  nombre text not null,
  diagnostico text not null,
  pendiente text null,
  fecha_visita date not null, -- YYYY-MM-DD format for scheduled visit date
  hospital_context text not null default 'Posadas',
  user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at_pacientes_post_alta()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pacientes_post_alta_set_updated_at on public.pacientes_post_alta;
create trigger trg_pacientes_post_alta_set_updated_at
before update on public.pacientes_post_alta
for each row execute function public.set_updated_at_pacientes_post_alta();

-- Indexes
create index if not exists pacientes_post_alta_hc_created_at_idx
  on public.pacientes_post_alta (hospital_context, created_at desc);

create index if not exists pacientes_post_alta_fecha_visita_idx
  on public.pacientes_post_alta (fecha_visita);

create index if not exists pacientes_post_alta_dni_idx
  on public.pacientes_post_alta (dni);

-- Row Level Security
alter table public.pacientes_post_alta enable row level security;

-- Policies (allow authenticated users scoped to 'Posadas')
drop policy if exists pacientes_post_alta_select on public.pacientes_post_alta;
create policy pacientes_post_alta_select
on public.pacientes_post_alta
for select
to authenticated
using (hospital_context = 'Posadas');

drop policy if exists pacientes_post_alta_insert on public.pacientes_post_alta;
create policy pacientes_post_alta_insert
on public.pacientes_post_alta
for insert
to authenticated
with check (hospital_context = 'Posadas');

drop policy if exists pacientes_post_alta_update on public.pacientes_post_alta;
create policy pacientes_post_alta_update
on public.pacientes_post_alta
for update
to authenticated
using (hospital_context = 'Posadas')
with check (hospital_context = 'Posadas');

drop policy if exists pacientes_post_alta_delete on public.pacientes_post_alta;
create policy pacientes_post_alta_delete
on public.pacientes_post_alta
for delete
to authenticated
using (hospital_context = 'Posadas');

-- Manual test data
-- insert into public.pacientes_post_alta (dni, nombre, diagnostico, pendiente, fecha_visita)
-- values ('12345678', 'María García', 'Migraña crónica', 'Control de tratamiento preventivo', current_date);