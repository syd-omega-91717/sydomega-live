-- Ω SYD OMEGA 91717 — member-owned storage deletion
-- Deletion remains RLS-scoped to the authenticated member's own uid folder.
drop policy if exists "avatars delete" on storage.objects;
create policy "avatars delete" on storage.objects
for delete to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "uploads delete" on storage.objects;
create policy "uploads delete" on storage.objects
for delete to authenticated
using (bucket_id='uploads' and (storage.foldername(name))[1] = auth.uid()::text);
