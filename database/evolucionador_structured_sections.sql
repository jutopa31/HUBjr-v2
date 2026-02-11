-- Adds structured sections support to diagnostic_assessments and evolucionador_drafts
alter table if exists diagnostic_assessments
  add column if not exists structured_sections jsonb default null,
  add column if not exists format_version smallint not null default 1;

alter table if exists evolucionador_drafts
  add column if not exists structured_sections jsonb default null,
  add column if not exists format_version smallint not null default 1;

create index if not exists diagnostic_assessments_structured_sections_gin
  on diagnostic_assessments using gin (structured_sections);

create index if not exists evolucionador_drafts_structured_sections_gin
  on evolucionador_drafts using gin (structured_sections);
