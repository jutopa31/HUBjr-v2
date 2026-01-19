-- Lecturas (ReadingBoard) - schema + seed
-- Safe to run incrementally.

create extension if not exists pgcrypto;

create table if not exists public.reading_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  category text not null,
  tags text[] not null default '{}',
  level text not null check (level in ('core', 'recommended', 'optional')),
  source text not null,
  year integer not null,
  reading_time text not null,
  link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reading_items add column if not exists slug text;
update public.reading_items
set slug = coalesce(slug, id::text)
where slug is null;
alter table public.reading_items alter column slug set not null;
create unique index if not exists reading_items_slug_key on public.reading_items (slug);

create index if not exists reading_items_category_idx on public.reading_items (category);
create index if not exists reading_items_level_idx on public.reading_items (level);
create index if not exists reading_items_tags_gin_idx on public.reading_items using gin (tags);

-- updated_at trigger (shared helper)
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reading_items_updated_at on public.reading_items;
create trigger trg_reading_items_updated_at
before update on public.reading_items
for each row execute function public.update_updated_at_column();

-- RLS
alter table public.reading_items enable row level security;

drop policy if exists "Anyone can view reading items" on public.reading_items;
create policy "Anyone can view reading items"
  on public.reading_items for select
  using (true);

drop policy if exists "Authenticated users insert reading items" on public.reading_items;
create policy "Authenticated users insert reading items"
  on public.reading_items for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users update reading items" on public.reading_items;
create policy "Authenticated users update reading items"
  on public.reading_items for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users delete reading items" on public.reading_items;
create policy "Authenticated users delete reading items"
  on public.reading_items for delete
  using (auth.uid() is not null);

-- Seed data from ReadingBoard
insert into public.reading_items
  (slug, title, summary, category, tags, level, source, year, reading_time, link)
values
  ('stroke-core', 'ACV isquemico agudo: ventana terapeutica y seleccion',
   'Resumen operativo de criterios de trombolisis y trombectomia con enfoque en tiempos, imagen y contraindicaciones.',
   'Stroke', array['acv','trombectomia','trombolisis'], 'core', 'Guia clinica', 2023, '12 min', null),
  ('status-epilepticus', 'Status epilepticus: escalamiento y manejo en UTI',
   'Pasos practicos para benzodiacepinas, carga antiseizure, infusion y objetivos de EEG.',
   'Epilepsy', array['status','uti','eeg'], 'core', 'Revision interna', 2022, '10 min', null),
  ('neuroinfect', 'Neuroinfecciones: meningitis y encefalitis',
   'Algoritmo de abordaje inicial, estudios urgentes y antibioticos de inicio segun contexto clinico.',
   'Neuroinfeccion', array['meningitis','encefalitis','antibioticos'], 'recommended', 'Checklist R1', 2021, '9 min', null),
  ('neuromuscular-gbs', 'SGB y CIDP: diagnostico diferencial y tratamiento',
   'Claves clinicas, criterios electrofisiologicos y decision entre IVIG y plasmaferesis.',
   'Neuromuscular', array['sgb','cidp','ivig'], 'recommended', 'NeuroResi', 2020, '11 min', null),
  ('movement-disorders', 'Trastornos del movimiento: Parkinson y atipicos',
   'Red flags, escalas utiles y plan de inicio de tratamiento para guardia y consultorio.',
   'Movement', array['parkinson','atipicos','updrs'], 'recommended', 'Ateneo', 2021, '13 min', null),
  ('headache-red-flags', 'Cefaleas: red flags y estudios iniciales',
   'Checklist rapido para diferenciar cefalea primaria de secundaria en guardia.',
   'Headache', array['cefalea','red-flags','guardia'], 'core', 'Guardia', 2023, '8 min', null),
  ('neurocritical', 'Neurocritico: control de presion intracraneal',
   'Medidas basicas, metas de perfusion y criterios de escalamiento en pacientes criticos.',
   'Neurocritical', array['pic','uti','perfusion'], 'optional', 'Protocolos', 2022, '7 min', null),
  ('dementia', 'Demencias: abordaje inicial y estudios',
   'Historia dirigida, screening cognitivo y laboratorios minimos para primera consulta.',
   'Cognitive', array['demencia','screening','memoria'], 'optional', 'Consultorio', 2021, '10 min', null)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  tags = excluded.tags,
  level = excluded.level,
  source = excluded.source,
  year = excluded.year,
  reading_time = excluded.reading_time,
  link = excluded.link;
