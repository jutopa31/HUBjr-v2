-- Creates the evolucionador-media bucket and policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evolucionador-media',
  'evolucionador-media',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Evolucionador media read"
  on storage.objects for select
  using (bucket_id = 'evolucionador-media' and auth.role() = 'authenticated');

create policy "Evolucionador media upload"
  on storage.objects for insert
  with check (bucket_id = 'evolucionador-media' and auth.uid() = owner);

create policy "Evolucionador media delete"
  on storage.objects for delete
  using (bucket_id = 'evolucionador-media' and auth.uid() = owner);
