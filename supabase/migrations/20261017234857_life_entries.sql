-- (2026-10-17, owner-approved: docs/plans/LIFE_CORE_PLAN.md) LIFE daily log.
-- One row per logged entry, so trends are queryable instead of trapped in
-- per-browser localStorage or opaque member_state blobs.
--
-- Members only: no is_platform_owner() branch. These are health-adjacent
-- entries (sleep, mood, weight, fasting) and nothing in the product needs the
-- owner to read them -- an explicit owner decision, not an omission.
-- GRANT and all four policies ship together (CLAUDE.md 8.1 class 6).
-- The import conflict target is a plain unique constraint, not a partial
-- index, so PostgREST's onConflict can name it (8.1 class 7).
-- Dormant: platform_settings.life_core_enabled starts false (CLAUDE.md 9).

create table if not exists public.life_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in
               ('mood','sleep','water','workout','meditate','breath','gratitude','body','fasting','habit')),
  day         date not null,
  value       numeric,
  note        text check (char_length(note) <= 2000),
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 8192),
  source      text not null default 'life' check (source in ('life','import')),
  client_ref  text check (char_length(client_ref) <= 120),
  created_at  timestamptz not null default now(),
  constraint life_entries_import_once unique (user_id, kind, client_ref)
);

create index if not exists life_entries_member_kind_day
  on public.life_entries (user_id, kind, day desc);

alter table public.life_entries enable row level security;

-- Guarded creates rather than remove-and-recreate: the table is new, and a
-- destructive statement stalls the Supabase connector on a confirmation it cannot show.
do $pol$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='life_entries' and policyname='life_entries_own_select') then
    create policy life_entries_own_select on public.life_entries for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='life_entries' and policyname='life_entries_own_insert') then
    create policy life_entries_own_insert on public.life_entries for insert to authenticated
      with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='life_entries' and policyname='life_entries_own_update') then
    create policy life_entries_own_update on public.life_entries for update to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='life_entries' and policyname='life_entries_own_delete') then
    create policy life_entries_own_delete on public.life_entries for delete to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $pol$;

revoke all on table public.life_entries from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.life_entries to authenticated;

insert into public.platform_settings (key, bool_value)
values ('life_core_enabled', false)
on conflict (key) do nothing;

comment on table public.life_entries is
  'LIFE daily log: one row per member entry. Own rows only (no owner read, by owner decision 2026-10-17). Writes dormant until platform_settings.life_core_enabled.';
