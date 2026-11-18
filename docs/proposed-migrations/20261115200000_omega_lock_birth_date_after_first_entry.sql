-- A member's date of birth decides their sign, element, god and agent (trg_derive_cosmology in
-- 0001_omega_master_deploy.sql: "birth date is authoritative"). Nothing stopped a member from submitting a
-- different date later, which changes their character. This locks it once set.
--
--   * First entry (old value null)          -> allowed, as before.
--   * Same value written again              -> allowed (the trigger does not fire).
--   * An end user changes or clears it      -> refused: SQLSTATE 42501, message 'birth_date_locked'.
--   * The platform owner (is_platform_owner) -> allowed, so the owner can correct a typo.
--   * Server-side callers with no JWT user (service role, SQL editor, migrations) -> allowed.
--
-- Trade-off the owner should know: a member who mistypes their date the first time cannot fix it
-- themselves; the owner does it. Members whose date is already set are locked from the moment this applies.
--
-- Status: PROPOSAL. This file remains deliberately outside supabase/migrations/ and
-- supabase/pending-migrations.json because the product/owner decision on locking member birth
-- dates is still open. The repository now supports explicitly registered PENDING_REVIEW /
-- NOT_APPLIED migrations with production-blocking release checks; the separate 2026-11-18
-- reservation-security migration uses that controlled path. Its existence does not authorize
-- this unrelated identity-policy change. To apply this proposal: obtain explicit owner approval
-- for the trade-off above, move it into supabase/migrations/, register it as pending, replay from
-- zero, probe by real impersonation on a non-production copy, then use the controlled push.

create schema if not exists private;

create or replace function private.lock_birth_date_after_first_entry()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is not null and not coalesce(public.is_platform_owner(), false) then
    raise exception 'birth_date_locked'
      using errcode = '42501',
            hint = 'The date of birth is already recorded. Ask the platform owner to correct it.';
  end if;
  return new;
end;
$$;

revoke all on function private.lock_birth_date_after_first_entry() from public, anon, authenticated;

drop trigger if exists trg_lock_birth_date on public.profiles;
create trigger trg_lock_birth_date
  before update of birth_date on public.profiles
  for each row
  when (old.birth_date is not null and new.birth_date is distinct from old.birth_date)
  execute function private.lock_birth_date_after_first_entry();
