-- ============================================================================
-- SYD OMEGA 91717 — 0007_permanent_access_policy.sql
--
-- 🔴 THIS IS MORE URGENT THAN 0003. Apply it in the same sitting.
--
-- POLICY BEING ENFORCED
--   Only an admin/owner has permanent access inherently.
--   Nobody else has it unless an owner explicitly grants it.
--   Everyone else gets the 9m17s trial window, or nothing.
--
-- ----------------------------------------------------------------------------
-- WHY 0003 ALONE WAS NOT ENOUGH
-- ----------------------------------------------------------------------------
-- 0003 locked down grant_permanent_access(). But the profiles table itself is
-- wide open. From access_gate.sql line 278:
--
--     GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
--
-- Table-wide UPDATE, every column. Combined with:
--
--     CREATE POLICY profiles_update ON public.profiles FOR UPDATE
--       USING      (auth.uid() = id OR public.is_platform_owner())
--       WITH CHECK (auth.uid() = id OR public.is_platform_owner());
--
-- ...any signed-in member can run this in the browser console:
--
--     await sb.from('profiles')
--       .update({ access_approved: true, is_trial: false, is_owner: true })
--       .eq('id', (await sb.auth.getUser()).data.user.id)
--
-- That grants themselves permanent access AND makes them an owner — which then
-- makes omega_is_owner() return true for them, handing over the whole platform.
-- It bypasses every function 0003 protected, because it never calls one.
--
-- ----------------------------------------------------------------------------
-- HOW THIS FILE ENFORCES THE POLICY
-- ----------------------------------------------------------------------------
-- 1. PROVENANCE. Permanent access is only real when an owner's grant is
--    recorded (permanent_granted_by). access_approved = true with is_trial =
--    false and no recorded grant no longer counts as access.
--
-- 2. A TRIGGER, not just grants. Column-level grants are the obvious fix, but
--    six of your existing SQL files loop over columns re-running
--    GRANT UPDATE (...) TO authenticated, and access_gate.sql re-grants the
--    whole table. Any re-run would silently reopen the hole. A BEFORE UPDATE
--    trigger cannot be undone by a GRANT, so the trigger is the primary
--    defence and the revoked grants are the second layer.
--
-- 3. OWNERSHIP IS NOT SELF-ASSIGNABLE. is_owner can only be changed by an
--    existing owner. This closes the escalation path completely.
--
-- Requires 0003 (omega_is_owner, access_grant_audit) and 0005 (trial_duration).
-- Idempotent. Creates no tables. Deletes no data. Revokes no legitimate access
-- until you deliberately run the remediation step in PART 5.
-- ============================================================================

begin;

do $reconcile$
declare fn text; r record;
  names text[] := array['has_active_access','grant_permanent_access',
    'revoke_permanent_access','ratify_existing_permanent_access',
    'guard_profile_privileges'];
begin
  foreach fn in array names loop
    for r in select p.oid::regprocedure::text as sig from pg_proc p
             join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and p.proname=fn loop
      begin execute 'drop function '||r.sig||' cascade';
        raise notice 'dropped % (recreated below)', r.sig;
      exception when others then raise notice 'could not drop % — %', r.sig, sqlerrm; end;
    end loop;
  end loop;
end $reconcile$;


-- ===========================================================================
-- PART 1 — PROVENANCE COLUMNS
-- ===========================================================================
alter table public.profiles
  add column if not exists permanent_granted_at timestamptz,
  add column if not exists permanent_granted_by uuid;

comment on column public.profiles.permanent_granted_by is
  'The owner who granted permanent access. NULL means no grant exists, and '
  'permanent access is therefore not valid regardless of access_approved.';


-- ===========================================================================
-- PART 2 — THE TRIGGER. Primary defence; survives any future GRANT.
-- ===========================================================================
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_owner_caller boolean;
  changed         text[] := '{}';
begin
  -- service_role and internal calls have no auth.uid(); let them through so
  -- migrations, triggers and Edge Functions keep working.
  if auth.uid() is null then return new; end if;

  begin
    is_owner_caller := public.omega_is_owner();
  exception when others then
    is_owner_caller := false;
  end;

  if is_owner_caller then return new; end if;

  -- Columns an ordinary member may never change on any row, including their own.
  if coalesce(new.access_approved,false)      is distinct from coalesce(old.access_approved,false)
    then changed := changed || 'access_approved'; end if;
  if coalesce(new.is_trial,false)             is distinct from coalesce(old.is_trial,false)
    then changed := changed || 'is_trial'; end if;
  if coalesce(new.is_owner,false)             is distinct from coalesce(old.is_owner,false)
    then changed := changed || 'is_owner'; end if;
  if new.trial_expires_at     is distinct from old.trial_expires_at
    then changed := changed || 'trial_expires_at'; end if;
  if new.trial_granted_at     is distinct from old.trial_granted_at
    then changed := changed || 'trial_granted_at'; end if;
  if new.permanent_granted_at is distinct from old.permanent_granted_at
    then changed := changed || 'permanent_granted_at'; end if;
  if new.permanent_granted_by is distinct from old.permanent_granted_by
    then changed := changed || 'permanent_granted_by'; end if;

  -- subscription_status confers access, so it is billing-owned, not member-owned.
  if to_jsonb(new) ? 'subscription_status'
     and (to_jsonb(new)->>'subscription_status')
         is distinct from (to_jsonb(old)->>'subscription_status')
    then changed := changed || 'subscription_status'; end if;

  if array_length(changed,1) > 0 then
    raise warning 'OMEGA_DENIED profile_privilege_write: actor=% target=% columns=%',
      auth.uid(), new.id, array_to_string(changed,',');
    raise exception
      'Not authorised: % may only be changed by a platform owner.',
      array_to_string(changed,', ')
      using errcode = '42501';
  end if;

  -- trial_started_at is member-writable ONCE, by start_trial_countdown().
  -- Block any attempt to move it backwards, which would extend the window.
  if old.trial_started_at is not null
     and new.trial_started_at is distinct from old.trial_started_at then
    raise exception 'Not authorised: the approval window cannot be restarted.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_privilege_guard on public.profiles;
create trigger profiles_privilege_guard
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();


-- ===========================================================================
-- PART 3 — SECOND LAYER: revoke the table-wide UPDATE.
-- Members keep UPDATE only on genuinely self-owned presentation columns.
-- ===========================================================================
revoke update on public.profiles from authenticated;
revoke insert on public.profiles from authenticated;   -- rows come from the 0004 trigger

do $g$
declare c text;
  self_editable text[] := array[
    'display_name','avatar_url','bio','theme','void_color','language',
    'timezone','demo_watched_at','date_of_birth','dob','onboarded_at',
    'trial_started_at'    -- written once via start_trial_countdown()
  ];
begin
  foreach c in array self_editable loop
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='profiles' and column_name=c) then
      execute format('grant update (%I) on public.profiles to authenticated', c);
    end if;
  end loop;
end $g$;


-- ===========================================================================
-- PART 4 — ACCESS IS COMPUTED, AND PERMANENT ACCESS REQUIRES PROVENANCE
-- ===========================================================================
create or replace function public.has_active_access(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_uid
      and (
        -- 1. Owners: permanent access, inherently. No grant record needed.
        coalesce(p.is_owner, false) = true

        -- 2. Explicitly granted permanent access. Requires BOTH the approval
        --    flag AND a recorded owner grant. A flag with no provenance is
        --    treated as no access — that is the point of this migration.
        or (coalesce(p.access_approved,false) = true
            and coalesce(p.is_trial,false) = false
            and p.permanent_granted_by is not null)

        -- 3. A live trial window.
        or (coalesce(p.access_approved,false) = true
            and coalesce(p.is_trial,false) = true
            and p.trial_expires_at is not null
            and p.trial_expires_at > now())
      )
  );
$$;
grant execute on function public.has_active_access(uuid) to authenticated;


create or replace function public.grant_permanent_access(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.omega_is_owner() then
    raise warning 'OMEGA_DENIED grant_permanent_access: actor=% target=%', auth.uid(), p_uid;
    raise exception 'Not authorised: only a platform owner may grant permanent access.'
      using errcode = '42501';
  end if;

  update public.profiles set
    access_approved      = true,
    is_trial             = false,
    trial_expires_at     = null,
    permanent_granted_at = now(),
    permanent_granted_by = auth.uid()
  where id = p_uid;

  if not found then
    raise exception 'No such member.' using errcode = 'P0002';
  end if;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('grant_permanent_access', auth.uid(), p_uid, true, 'permanent access granted');
end;
$$;
revoke all on function public.grant_permanent_access(uuid) from public, anon;
grant execute on function public.grant_permanent_access(uuid) to authenticated;


create or replace function public.revoke_permanent_access(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.omega_is_owner() then
    raise warning 'OMEGA_DENIED revoke_permanent_access: actor=% target=%', auth.uid(), p_uid;
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  update public.profiles set
    access_approved      = false,
    is_trial             = false,
    trial_expires_at     = null,
    permanent_granted_at = null,
    permanent_granted_by = null
  where id = p_uid and coalesce(is_owner,false) = false;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('revoke_permanent_access', auth.uid(), p_uid, true, 'permanent access revoked');
end;
$$;
revoke all on function public.revoke_permanent_access(uuid) from public, anon;
grant execute on function public.revoke_permanent_access(uuid) to authenticated;


-- ===========================================================================
-- PART 5 — REMEDIATION. READ THE REPORT BEFORE RUNNING ANYTHING HERE.
-- ===========================================================================

-- Who has permanent access right now, and can they prove it was granted?
create or replace view public.permanent_access_review as
select
  p.id,
  p.email,
  coalesce(p.is_owner,false)        as is_owner,
  p.access_approved,
  p.is_trial,
  p.permanent_granted_at,
  p.permanent_granted_by,
  case
    when coalesce(p.is_owner,false)        then 'OWNER — permanent by role'
    when p.permanent_granted_by is not null then 'GRANTED — provenance on record'
    when coalesce(p.access_approved,false) and coalesce(p.is_trial,false) = false
      then 'UNEXPLAINED — permanent flag with no grant record'
    when coalesce(p.is_trial,false)         then 'TRIAL'
    else 'NO ACCESS'
  end as standing
from public.profiles p
order by 8, p.email;

revoke all on public.permanent_access_review from public, anon;


-- Stamp provenance on members you HAVE legitimately approved, so this migration
-- does not lock them out. OWNER ONLY, and deliberately NOT automatic:
-- review permanent_access_review first, revoke anyone you do not recognise,
-- and only then ratify the rest.
create or replace function public.ratify_existing_permanent_access()
returns integer language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n integer;
begin
  if not public.omega_is_owner() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;

  with upd as (
    update public.profiles set
      permanent_granted_at = coalesce(permanent_granted_at, now()),
      permanent_granted_by = coalesce(permanent_granted_by, me)
    where coalesce(access_approved,false) = true
      and coalesce(is_trial,false) = false
      and coalesce(is_owner,false) = false
      and permanent_granted_by is null
    returning id
  )
  select count(*) into n from upd;

  insert into public.access_grant_audit(action, actor_uid, target_uid, allowed, detail)
  values ('ratify_existing_permanent_access', me, null, true,
          n || ' pre-existing permanent grants ratified');

  return n;
end;
$$;
revoke all on function public.ratify_existing_permanent_access() from public, anon;
grant execute on function public.ratify_existing_permanent_access() to authenticated;

commit;


-- ============================================================================
-- DO THIS NOW, IN ORDER
--
-- 1. Look at who currently claims permanent access:
--
--      select * from public.permanent_access_review;
--
--    Every row marked UNEXPLAINED has the permanent flag with no grant on
--    record. Some will be people you approved before this migration existed.
--    Some may not be. You are the only one who can tell them apart.
--
-- 2. Revoke anyone you do not recognise:
--
--      select public.revoke_permanent_access('<uuid>');
--
-- 3. Only then ratify the rest, so they are not locked out:
--
--      select public.ratify_existing_permanent_access();
--
--    Until you run step 3, UNEXPLAINED members are treated as having NO access
--    by has_active_access(). That is deliberate — deny first, restore
--    deliberately.
--
-- 4. Verify the escalation path is closed. Sign in as an ordinary member and
--    run in the browser console. All three must fail with 42501:
--
--      await sb.from('profiles').update({is_owner:true}).eq('id',uid)
--      await sb.from('profiles').update({access_approved:true,is_trial:false}).eq('id',uid)
--      await sb.rpc('grant_permanent_access',{p_uid:uid})
--
-- 5. Denied attempts are logged to the Postgres log, not the audit table
--    (an exception rolls back an insert). Read them in
--    Supabase -> Logs -> Postgres, filtering for OMEGA_DENIED.
--
-- ----------------------------------------------------------------------------
-- STILL OPEN
--
-- * has_active_access() must actually be USED. Every RLS policy and page gate
--   still testing access_approved directly will keep honouring an unexplained
--   permanent flag. Find them:
--
--     select c.relname, p.polname, pg_get_expr(p.polqual, p.polrelid)
--     from pg_policy p join pg_class c on c.oid=p.polrelid
--     join pg_namespace n on n.oid=c.relnamespace
--     where n.nspname='public'
--       and pg_get_expr(p.polqual,p.polrelid) ilike '%access_approved%';
--
-- * axis_a / axis_b / axis_c are still member-writable. Those are progress
--   metrics that drive levels and rewards, so a member can currently award
--   themselves progress. Not changed here because locking them may break
--   existing features — but it needs a decision. See DECISIONS.md D-026.
--
-- * approve_member() is called by approvals.html but is not defined in any of
--   your 92 SQL files. If it exists only in production, it may set
--   access_approved without recording provenance, which would recreate
--   UNEXPLAINED rows. Inspect it:
--
--     select prosrc from pg_proc where proname = 'approve_member';
-- ============================================================================
