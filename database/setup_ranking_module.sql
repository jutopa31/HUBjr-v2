-- Ranking module baseline schema (topics, participations, ledger)
-- Safe to run incrementally; does not drop existing objects.

-- Enable extension for UUIDs if not present
create extension if not exists pgcrypto;

-- Topics published by Jefatura
create table if not exists public.ranking_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  period text not null check (period in ('weekly','monthly')),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  objectives text,
  materials jsonb,
  hospital_context text not null default 'Posadas',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Participations submitted by residents
create table if not exists public.ranking_participations (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.ranking_topics(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('articulo','clase','revision')),
  link text,
  comment text,
  status text not null default 'submitted' check (status in ('submitted','validated','rejected')),
  created_at timestamptz not null default now()
);

-- Ledger of points (immutable events) assigned on validation
create table if not exists public.ranking_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  topic_id uuid not null references public.ranking_topics(id) on delete cascade,
  participation_id uuid references public.ranking_participations(id) on delete set null,
  points integer not null check (points >= 0),
  reason text,
  created_at timestamptz not null default now()
);

-- Simple weekly leaderboard view (current week by ISO week)
create or replace view public.ranking_leaderboard_weekly as
select
  l.user_id,
  coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Anonimo') as display_name,
  p.training_level as level,
  sum(l.points) as points,
  t.hospital_context as hospital_context
from public.ranking_ledger l
left join public.resident_profiles p on p.user_id = l.user_id
left join public.ranking_topics t on t.id = l.topic_id
where date_part('year', l.created_at) = date_part('year', current_date)
  and date_part('week', l.created_at) = date_part('week', current_date)
group by l.user_id, p.first_name, p.last_name, p.training_level, t.hospital_context
order by points desc;

-- Simple monthly leaderboard view (current month)
create or replace view public.ranking_leaderboard_monthly as
select
  l.user_id,
  coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Anonimo') as display_name,
  p.training_level as level,
  sum(l.points) as points,
  t.hospital_context as hospital_context
from public.ranking_ledger l
left join public.resident_profiles p on p.user_id = l.user_id
left join public.ranking_topics t on t.id = l.topic_id
where date_trunc('month', l.created_at) = date_trunc('month', current_date)
group by l.user_id, p.first_name, p.last_name, p.training_level, t.hospital_context
order by points desc;

-- Note: RLS policies and RPCs should be added in a follow-up migration
-- to ensure only Jefatura can publish topics and validate participations,
-- and residents can only create/read their own participations.

-- Enable RLS and add policies
alter table public.ranking_topics enable row level security;
alter table public.ranking_participations enable row level security;
alter table public.ranking_ledger enable row level security;

-- Policies for ranking_topics
drop policy if exists "Public can read published topics" on public.ranking_topics;
create policy "Public can read published topics" on public.ranking_topics
  for select using (
    status = 'published'
  );

drop policy if exists "Admins manage topics" on public.ranking_topics;
create policy "Admins manage topics" on public.ranking_topics
  for all using (
    has_admin_privilege((select auth.email()), 'full_admin')
  ) with check (
    has_admin_privilege((select auth.email()), 'full_admin')
  );

-- Policies for ranking_participations
drop policy if exists "Users read own participations" on public.ranking_participations;
create policy "Users read own participations" on public.ranking_participations
  for select using (
    auth.uid() = user_id
    or has_admin_privilege((select auth.email()), 'full_admin')
  );

drop policy if exists "Users insert own participations" on public.ranking_participations;
create policy "Users insert own participations" on public.ranking_participations
  for insert with check (
    auth.uid() = user_id
  );

drop policy if exists "Admins update participations" on public.ranking_participations;
create policy "Admins update participations" on public.ranking_participations
  for update using (
    has_admin_privilege((select auth.email()), 'full_admin')
  ) with check (
    has_admin_privilege((select auth.email()), 'full_admin')
  );

-- Policies for ranking_ledger
drop policy if exists "Users read own ledger" on public.ranking_ledger;
create policy "Users read own ledger" on public.ranking_ledger
  for select using (
    auth.uid() = user_id
    or has_admin_privilege((select auth.email()), 'full_admin')
  );

drop policy if exists "Admins insert ledger" on public.ranking_ledger;
create policy "Admins insert ledger" on public.ranking_ledger
  for insert with check (
    has_admin_privilege((select auth.email()), 'full_admin')
  );

-- RPC: validate participation atomically (admin only)
create or replace function public.ranking_validate_participation(participation_id uuid, points integer)
returns void
language plpgsql
security definer
as $$
declare
  part record;
begin
  -- Check admin privilege
  if not has_admin_privilege((select auth.email()), 'full_admin') then
    raise exception 'Insufficient privileges';
  end if;

  select id, topic_id, user_id into part from public.ranking_participations where id = participation_id;
  if not found then
    raise exception 'Participation not found';
  end if;

  update public.ranking_participations set status = 'validated' where id = participation_id;

  insert into public.ranking_ledger(user_id, topic_id, participation_id, points, reason)
  values (part.user_id, part.topic_id, participation_id, greatest(points, 0), 'validated');
end;
$$;

-- RPC: award points for a user (admin or LP admin)
create or replace function public.ranking_award_points(user_id uuid, topic_id uuid, points integer, reason text default 'lumbar_puncture')
returns void
language plpgsql
security definer
as $$
begin
  if not (
    has_admin_privilege((select auth.email()), 'full_admin') or
    has_admin_privilege((select auth.email()), 'lumbar_puncture_admin')
  ) then
    raise exception 'Insufficient privileges';
  end if;

  insert into public.ranking_ledger(user_id, topic_id, participation_id, points, reason)
  values (user_id, topic_id, null, greatest(points, 0), coalesce(reason, 'lumbar_puncture'));
end;
$$;
