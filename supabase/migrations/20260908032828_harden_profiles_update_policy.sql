-- Transcribed verbatim from the live ledger on 2026-09-13.
--
-- This migration was applied to production through `apply_migration`, which
-- writes a remote row and no local file (CLAUDE.md §5). The row existed at
-- version 20260908032828 with these exact statements while
-- supabase/migrations/ had nothing for it, so `supabase db push` reported
-- "Remote migration versions not found in local migrations directory".
--
-- Materialised here from supabase_migrations.schema_migrations.statements so
-- the sequence reproduces production. Not re-applied: the policy below is
-- already live and was verified in place before this file was written.

drop policy if exists profiles_update on public.profiles;
create policy profiles_update
  on public.profiles
  for update
  to public
  using ((select auth.uid()) = id or (select private.is_platform_owner()))
  with check ((select auth.uid()) = id or (select private.is_platform_owner()));
