-- SYD OMEGA 91717 — file storage: buckets, policies, attachment columns (idempotent)

-- buckets: avatars (public-read), uploads (private, owner-only)
insert into storage.buckets (id,name,public) values ('avatars','avatars',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('uploads','uploads',false) on conflict (id) do nothing;

-- AVATARS — anyone may read; a member may write/replace only inside their own folder (folder = their user id)
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id='avatars');
drop policy if exists "avatars write" on storage.objects;
create policy "avatars write" on storage.objects for insert to authenticated
  with check (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update" on storage.objects;
create policy "avatars update" on storage.objects for update to authenticated
  using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- UPLOADS — a member may read & write only inside their own folder
drop policy if exists "uploads read" on storage.objects;
create policy "uploads read" on storage.objects for select to authenticated
  using (bucket_id='uploads' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "uploads write" on storage.objects;
create policy "uploads write" on storage.objects for insert to authenticated
  with check (bucket_id='uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- attachment columns on the records that carry files
alter table public.profiles add column if not exists avatar_url text;
alter table public.publications add column if not exists file_path text;
alter table public.consult_requests add column if not exists file_path text;
alter table public.media_reservations add column if not exists file_path text;
