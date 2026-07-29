-- ============================================================================
-- SYD OMEGA 91717 — 0005_trial_917.sql
--
-- Timed access grant: exactly 9 minutes 17 seconds.
--
-- ----------------------------------------------------------------------------
-- TWO PROBLEMS WITH THE EXISTING TRIAL SYSTEM
-- ----------------------------------------------------------------------------
-- 1. WRONG DURATION.
--    trial_access.sql grants `INTERVAL '550.302 seconds'`, described in its own
--    comment as "exactly 9.1717 minutes". That is 9 minutes 10.3 seconds.
--    9 minutes 17 seconds is 557 seconds. The existing grant is 6.7 seconds
--    short. 9.1717 minutes and 9:17 are different quantities — the decimal
--    reading of 91717 is not the clock reading.
--
-- 2. EXPIRY IS ENFORCED BY THE BROWSER.
--    trial_access.sql comment: "expire_trial — called by client when countdown
--    hits zero". `access_approved` stays TRUE in the database until the
--    member's own browser volunteers to revoke it. Close the tab, lose
--    connection, disable JavaScript, or simply never load the countdown, and
--    the trial never ends. The 9-minute window is currently a suggestion.
--
-- ----------------------------------------------------------------------------
-- THE FIX
-- ----------------------------------------------------------------------------
-- Duration becomes 557 seconds, defined once in trial_duration() so it cannot
-- drift across the copies of this logic in trial_fix.sql, chunk_*.sql and
-- migration_runner.sql.
--
-- Enforcement moves server-side. `has_active_access()` computes access from
-- trial_expires_at at query time, so an expired trial is denied the instant the
-- clock passes, whether or not the browser cooperates. Client countdown becomes
-- a courtesy display, not the enforcement mechanism.
--
-- Requires 0003_privilege_lockdown.sql (owner checks, omega_is_owner, audit).
--
-- SAFETY: idempotent, no data loss, signatures unchanged.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Single source of truth for the duration. 9m17s = 557s.
-- ---------------------------------------------------------------------------
create or replace function public.trial_duration()
returns interval language sql immutable as $$
  select interval '557 seconds';   -- 9 minutes 17 seconds
$$;

grant execute on function public.trial_duration() to authenticated, anon;


-- ---------------------------------------------------------------------------
-- 2. grant_trial_access — owner only, 557 seconds, audited.
--    Redefined here so the duration comes from trial_duration() rather than a
--    literal that can drift.
-- ---------------------------------------------------------------------------
-- 0003 defines this returning void; here it returns the expiry timestamp so the
-- UI can start its countdown from the server's own value rather than guessing.
-- CREATE OR REPLACE cannot change a return type, so drop first. Safe: nothing
-- depends on it structurally, and approvals.html calls it via RPC, which does
-- not care that it now returns a value.
drop function if exists public.grant_trial_access(uuid);

create function public.grant_trial_access(p_uid uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare expires timestamptz;
begin
  if not public.omega_is_owner() then
    -- NOTE: an INSERT here would be rolled back by the RAISE below —
    -- the audit table cannot record denials from inside the failing
    -- transaction. RAISE WARNING goes to the Postgres server log, which
    -- is NOT transactional, so it survives. Read denials in the Supabase
    -- dashboard under Logs -> Postgres, filtering for OMEGA_DENIED.
    raise warning 'OMEGA_DENIED grant_trial_access: actor=% target=% reason=%',
      auth.uid(), p_uid, 'DENIED: caller is not an owner';
    raise exception 'Not authorised: only a platform owner may grant trial access.'
      using errcode = '42501';
  end if;

  expires := now() + public.trial_duration();

  update public.profiles set
    access_approved  = true,
    is_trial         = true,
    trial_expires_at = expires
  where id = p_uid
    and (is_owner is null or is_owner = false);

  if not found then
    insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
    values ('grant_trial_access', auth.uid(), p_uid, false,
            'no matching non-owner profile row');
    raise exception 'No such member, or the target is an owner.' using errcode = 'P0002';
  end if;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('grant_trial_access', auth.uid(), p_uid, true,
          'trial granted until ' || expires::text);

  return expires;
end;
$$;

revoke all on function public.grant_trial_access(uuid) from public, anon;
grant execute on function public.grant_trial_access(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 3. THE ENFORCEMENT PRIMITIVE.
--    Access is COMPUTED, never merely stored. An expired trial is denied at
--    query time regardless of what access_approved still says.
--    Use this everywhere the platform asks "may this member be here?"
-- ---------------------------------------------------------------------------
create or replace function public.has_active_access(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_uid
      and coalesce(p.access_approved, false) = true
      and (
        coalesce(p.is_trial, false) = false          -- permanent access
        or (p.trial_expires_at is not null           -- trial, still running
            and p.trial_expires_at > now())
      )
  );
$$;

grant execute on function public.has_active_access(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Status for the countdown UI. Seconds remaining is computed by the
--    SERVER, so a member cannot gain time by changing their system clock.
-- ---------------------------------------------------------------------------
create or replace function public.check_trial_status(p_uid uuid default auth.uid())
returns table (
  is_trial          boolean,
  access_approved   boolean,
  trial_expires_at  timestamptz,
  seconds_remaining integer,
  expired           boolean,
  server_time       timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    coalesce(p.is_trial, false),
    coalesce(p.access_approved, false),
    p.trial_expires_at,
    case
      when p.trial_expires_at is null then null
      else greatest(0, ceil(extract(epoch from (p.trial_expires_at - now())))::integer)
    end,
    case
      when coalesce(p.is_trial, false) = false then false
      when p.trial_expires_at is null then true
      else p.trial_expires_at <= now()
    end,
    now()
  from public.profiles p
  where p.id = p_uid
    and (p_uid = auth.uid() or public.omega_is_owner());
$$;

grant execute on function public.check_trial_status(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Sweep expired trials. The has_active_access() computation already denies
--    them, so this is bookkeeping rather than enforcement — it keeps the
--    profiles table honest and performs the progress reset.
--
--    Schedule it with pg_cron if available:
--      select cron.schedule('omega-expire-trials', '* * * * *',
--                           $c$ select public.sweep_expired_trials(); $c$);
--    If pg_cron is not enabled, call it from the approvals page or a scheduled
--    Edge Function. Either way, enforcement does not depend on it running.
-- ---------------------------------------------------------------------------
create or replace function public.sweep_expired_trials()
returns integer language plpgsql security definer set search_path = public as $$
declare
  r  record;
  n  integer := 0;
begin
  for r in
    select id from public.profiles
    where coalesce(is_trial, false) = true
      and trial_expires_at is not null
      and trial_expires_at <= now()
  loop
    update public.profiles set
      access_approved  = false,
      is_trial         = false,
      trial_expires_at = null,
      axis_a           = 1.0,
      axis_b           = 1.0,
      axis_c           = 1.0
    where id = r.id;

    begin
      delete from public.task_completions where user_id = r.id;
    exception when undefined_table then
      null;   -- task_completions absent in some schema variants
    end;

    insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
    values ('sweep_expired_trials', null, r.id, true, 'trial expired; progress reset');

    n := n + 1;
  end loop;

  return n;
end;
$$;

revoke all on function public.sweep_expired_trials() from public, anon, authenticated;
-- service_role and pg_cron only. No member may trigger a mass reset.

commit;


-- ============================================================================
-- VERIFY
--
-- 1. Duration is exactly 9m17s:
--      select public.trial_duration();                  -- 00:09:17
--      select extract(epoch from public.trial_duration());  -- 557
--
-- 2. Grant one and watch it count down, server-side:
--      select public.grant_trial_access('<uuid>');
--      select * from public.check_trial_status('<uuid>');
--
-- 3. Confirm expiry is real. Force a past expiry and check access is denied
--    WITHOUT the browser doing anything:
--      update public.profiles
--         set trial_expires_at = now() - interval '1 second'
--       where id = '<uuid>';
--      select public.has_active_access('<uuid>');        -- must be false
--                                                        -- while access_approved
--                                                        -- is still true
--
-- ----------------------------------------------------------------------------
-- STILL TO DO — has_active_access() must actually be USED.
--
-- Defining it does not enforce it. Every RLS policy and every page gate that
-- currently tests `access_approved` should test `public.has_active_access()`
-- instead, or an expired trial keeps working on any page that checks the raw
-- column. Sweep them:
--
--   select c.relname, p.polname, pg_get_expr(p.polqual, p.polrelid)
--   from pg_policy p
--   join pg_class c on c.oid = p.polrelid
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public'
--     and pg_get_expr(p.polqual, p.polrelid) ilike '%access_approved%';
--
-- Converting those is a scoped task for Session 2 — mechanical, but it must be
-- done deliberately and reviewed, not swept with a blind UPDATE.
-- ============================================================================
