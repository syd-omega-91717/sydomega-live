-- Ω SYD OMEGA 91717 — governed publication attachment bridge
-- New uploads reference server-registered private content; legacy paths remain intact.
begin;
create unique index if not exists storage_files_id_owner_unique on public.storage_files (id, owner_id);
alter table public.publications add column if not exists content_file_id uuid;
alter table public.publications add constraint publications_content_file_owner_fkey
  foreign key (content_file_id, user_id) references public.storage_files (id, owner_id)
  on delete set null (content_file_id);
alter table public.publications add constraint publications_content_file_compatibility_check
  check (content_file_id is null or (user_id is not null and file_path is null));
create index if not exists publications_content_file_id_idx
  on public.publications (content_file_id) where content_file_id is not null;
comment on column public.publications.content_file_id is
  'Owner-matched reference to a private server-registered storage_files row. Null means no governed attachment; legacy file_path remains supported for pre-bridge records.';
commit;
