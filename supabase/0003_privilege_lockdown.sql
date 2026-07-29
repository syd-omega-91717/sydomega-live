-- ============================================================================
-- SYD OMEGA 91717 — 0003_privilege_lockdown.sql
--
-- 🔴 APPLY THIS BEFORE ANYTHING ELSE IN THIS BUNDLE. 🔴
--
-- ----------------------------------------------------------------------------
-- THE PROBLEM
-- ----------------------------------------------------------------------------
-- trial_access.sql (and its duplicates in trial_fix.sql, chunk_*.sql,
-- migration_runner.sql) ends with:
--
--     GRANT EXECUTE ON FUNCTION expire_trial(UUID)           TO authenticated;
--     GRANT EXECUTE ON FUNCTION grant_trial_access(UUID)     TO authenticated;
--     GRANT EXECUTE ON FUNCTION grant_permanent_access(UUID) TO authenticated;
--
-- All three are SECURITY DEFINER, all three take an arbitrary user id, and
-- NONE of them checks who is calling. Any signed-in member can run this from
-- the browser console on any page:
--
--     await sb.rpc('grant_permanent_access', { p_uid: (await sb.auth.getUser()).data.user.id })
--
-- and approve themselves. The entire approval queue, the pending gate, the
-- owner review step — all of it is bypassed by one line. `expire_trial` is
-- worse in a different way: it takes any UUID, revokes that member's access,
-- resets their three matrix axes to 1.0 and DELETEs their task_completions.
-- One member can wipe another member's progress permanently.
--
-- This outranks the RLS findings. RLS gaps expose data; this hands out
-- authorisation.
--
-- ----------------------------------------------------------------------------
-- THE FIX
-- ----------------------------------------------------------------------------
--   * Revoke all three from `authenticated` and from PUBLIC.
--   * Rewrite each with an internal caller check, so even a future accidental
--     GRANT cannot re-open the hole. Defence in depth: the GRANT is the lock,
--     the internal check is the deadbolt.
--   * expire_trial keeps a legitimate self-service path — a member may expire
--     THEIR OWN trial — but may never touch anyone else's row.
--   * Add an audit trail, so you can see whether this was ever exploited.
--
-- SAFETY: idempotent, creates no tables beyond the audit log, deletes no data.
-- Function signatures are unchanged, so approvals.html keeps working.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Audit trail. Written by the privileged functions themselves.
-- ---------------------------------------------------------------------------
create table if not exists public.access_grant_audit (
  id           bigserial primary key,
  occurred_at  timestamptz not null default now(),
  action       text        not null,
  actor_uid    uuid,
  target_uid   uuid,
  allowed      boolean     not null,
  detail       text
);

alter table public.access_grant_audit enable row level security;

drop policy if exists access_grant_audit_owner_read on public.access_grant_audit;
create policy access_grant_audit_owner_read on public.access_grant_audit
  for select using (public.is_platform_owner());
-- No insert policy: rows are written only by SECURITY DEFINER functions below.


-- ---------------------------------------------------------------------------
-- Caller check. Accepts either the platform_owners membership used by
-- is_platform_owner(), or profiles.is_owner, because both appear across the
-- source files and it is not yet settled which one is authoritative.
-- Recorded as an open question in DECISIONS.md (D-012).
-- ---------------------------------------------------------------------------
create or replace function public.omega_is_owner()
returns boolean language plpgsql stable security definer set search_path = public as $$
declare ok boolean := false;
begin
  begin
    ok := public.is_platform_owner();
  exception when others then
    ok := false;
  end;

  if ok then return true; end if;

  begin
    select coalesce(p.is_owner, false) into ok
    from public.profiles p where p.id = auth.uid();
  exception when others then
    ok := false;
  end;

  return coalesce(ok, false);
end;
$$;

revoke all on function public.omega_is_owner() from public;
grant execute on function public.omega_is_owner() to authenticated;


-- ---------------------------------------------------------------------------
-- 1. grant_permanent_access — OWNER ONLY.
-- ---------------------------------------------------------------------------
create or replace function public.grant_permanent_access(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.omega_is_owner() then
    -- NOTE: an INSERT here would be rolled back by the RAISE below —
    -- the audit table cannot record denials from inside the failing
    -- transaction. RAISE WARNING goes to the Postgres server log, which
    -- is NOT transactional, so it survives. Read denials in the Supabase
    -- dashboard under Logs -> Postgres, filtering for OMEGA_DENIED.
    raise warning 'OMEGA_DENIED grant_permanent_access: actor=% target=% reason=%',
      auth.uid(), p_uid, 'DENIED: caller is not an owner';
    raise exception 'Not authorised: only a platform owner may grant access.'
      using errcode = '42501';
  end if;

  update public.profiles set
    access_approved  = true,
    is_trial         = false,
    trial_expires_at = null
  where id = p_uid;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('grant_permanent_access', auth.uid(), p_uid, true, 'permanent access granted');
end;
$$;


-- ---------------------------------------------------------------------------
-- 2. grant_trial_access — OWNER ONLY.
--    Duration handled in 0005_trial_917.sql; this file only closes the hole.
-- ---------------------------------------------------------------------------
create or replace function public.grant_trial_access(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
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

  update public.profiles set
    access_approved  = true,
    is_trial         = true,
    trial_expires_at = now() + interval '557 seconds'   -- 9m17s; see 0005
  where id = p_uid
    and (is_owner is null or is_owner = false);

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('grant_trial_access', auth.uid(), p_uid, true, 'trial granted (557s)');
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. expire_trial — SELF or OWNER, never an arbitrary third party.
--    This is the destructive one: it resets axes and deletes task_completions.
-- ---------------------------------------------------------------------------
create or replace function public.expire_trial(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (auth.uid() = p_uid or public.omega_is_owner()) then
    -- RAISE WARNING, not an INSERT: the exception below would roll the INSERT
    -- back. Server-log entries are not transactional and survive. Find these in
    -- Supabase -> Logs -> Postgres, filtering for OMEGA_DENIED.
    raise warning 'OMEGA_DENIED expire_trial: actor=% target=% reason=%',
      auth.uid(), p_uid, 'attempted to expire another member''s trial';
    raise exception 'Not authorised: you may only expire your own trial.'
      using errcode = '42501';
  end if;

  update public.profiles set
    access_approved  = false,
    is_trial         = false,
    trial_expires_at = null,
    axis_a           = 1.0,
    axis_b           = 1.0,
    axis_c           = 1.0
  where id = p_uid;

  delete from public.task_completions where user_id = p_uid;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('expire_trial', auth.uid(), p_uid, true, 'trial expired and progress reset');
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. Revoke the blanket grants. The internal checks above are the deadbolt;
--    this is the lock. expire_trial keeps EXECUTE because it self-authorises
--    per row; the other two do not need it from the browser at all, since
--    approvals.html is used by owners who pass the internal check anyway.
-- ---------------------------------------------------------------------------
revoke all on function public.grant_permanent_access(uuid) from public;
revoke all on function public.grant_trial_access(uuid)     from public;
revoke all on function public.expire_trial(uuid)           from public;

revoke execute on function public.grant_permanent_access(uuid) from anon;
revoke execute on function public.grant_trial_access(uuid)     from anon;
revoke execute on function public.expire_trial(uuid)           from anon;

-- Owners call these from approvals.html while signed in as `authenticated`,
-- so EXECUTE must remain for that role — the internal owner check is what
-- actually protects them now.
grant execute on function public.grant_permanent_access(uuid) to authenticated;
grant execute on function public.grant_trial_access(uuid)     to authenticated;
grant execute on function public.expire_trial(uuid)           to authenticated;

commit;


-- ============================================================================
-- VERIFY — 1. Were you exploited? Run this and read every row.
--
--   select * from public.access_grant_audit order by occurred_at desc;
--
-- The audit table starts empty, so it only captures activity from now on.
-- For historical evidence, look for members approved without a corresponding
-- owner action:
--
--   select id, display_name, access_approved, is_trial, trial_expires_at, created_at
--   from public.profiles
--   where access_approved = true
--   order by created_at desc;
--
-- Anyone in that list you do not remember approving is worth investigating.
--
-- 2. Confirm the hole is closed. Sign in as an ordinary member and run in the
--    browser console — it must now fail with a 42501:
--
--   await sb.rpc('grant_permanent_access',
--     { p_uid: (await sb.auth.getUser()).data.user.id })
-- ============================================================================
