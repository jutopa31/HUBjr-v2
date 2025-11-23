-- Admin-only RPC to list Supabase auth users for linking resident profiles
create or replace function public.list_auth_users(q text default '', lim int default 20)
returns table (
  id uuid,
  email text,
  full_name text,
  training_level text,
  linked boolean
)
language plpgsql
security definer
as $$
begin
  -- Require admin or user_management privilege
  if not (
    has_admin_privilege((select auth.email()), 'full_admin') or
    has_admin_privilege((select auth.email()), 'user_management')
  ) then
    raise exception 'Insufficient privileges';
  end if;

  return query
  select u.id,
         u.email,
         coalesce(u.raw_user_meta_data->>'full_name',
                  u.raw_user_meta_data->>'name',
                  split_part(u.email, '@', 1)) as full_name,
         coalesce(u.raw_user_meta_data->>'training_level', null) as training_level,
         (rp.id is not null) as linked
  from auth.users u
  left join public.resident_profiles rp on rp.user_id = u.id
  where (q is null or q = '')
     or (u.email ilike '%'||q||'%'
         or (u.raw_user_meta_data->>'full_name') ilike '%'||q||'%')
  order by u.created_at desc
  limit greatest(lim, 1);
end;
$$;
