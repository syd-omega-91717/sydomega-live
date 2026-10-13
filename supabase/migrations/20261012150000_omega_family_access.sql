-- Ω family access (blueprint points 12, 13, 455, N142) — owner decision 2026-10-12:
-- the owner may grant free, permanent access to ADULT family members and link
-- them as family; a family member's name never appears in a list other members
-- can see. Decision record: docs/decisions/family-access/PLAN.md (+ CODEX_REVIEW.md).
--
-- Additive only, no DROP. Replaced function bodies are based on live
-- pg_get_functiondef (2026-10-12); intentional family-visibility changes are
-- marked below. Keep all member-visible ranking paths covered by the contract.

-- 1. The link ---------------------------------------------------------------
alter table public.profiles
  add column if not exists family_of uuid
    references public.profiles(id) on delete set null;

do $$ begin
  if not exists (select 1 from pg_constraint
                 where conname = 'profiles_family_of_not_self'
                   and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles
      add constraint profiles_family_of_not_self
      check (family_of is null or family_of <> id);
  end if;
end $$;

create index if not exists profiles_family_of_idx
  on public.profiles (family_of) where family_of is not null;

comment on column public.profiles.family_of is
  'Owner account this adult member is linked to as family (owner-granted, '
  'docs/decisions/family-access). Owner-only: no column grant, and '
  'guard_profile_privileges() rejects any non-owner change. Members with a '
  'link are excluded from every member-visible ranking.';

-- 2. Guard: family_of is owner-only. authenticated has no INSERT on profiles,
--    so BEFORE UPDATE covers every member write path. If an INSERT grant is
--    ever added, extend this guard to INSERT.
create or replace function public.guard_profile_privileges()
 returns trigger
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
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

  -- Columns an ordinary member may never RAISE on any row, including their own.
  -- Giving access up (deactivate, erasure) is never an escalation, so a change
  -- to false passes. Literals are typed: `text[] || 'x'` parses 'x' as an array
  -- and raised 22P02 instead of this guard's 42501.
  if coalesce(new.access_approved,false) and not coalesce(old.access_approved,false)
    then changed := changed || 'access_approved'::text; end if;
  if coalesce(new.is_trial,false) and not coalesce(old.is_trial,false)
    then changed := changed || 'is_trial'::text; end if;
  if coalesce(new.is_owner,false)             is distinct from coalesce(old.is_owner,false)
    then changed := changed || 'is_owner'::text; end if;
  -- Clearing the expiry is a downgrade only when the trial ends with it; a
  -- live trial with no expiry would read as unlimited.
  if new.trial_expires_at is distinct from old.trial_expires_at
     and not (new.trial_expires_at is null and not coalesce(new.is_trial,false))
    then changed := changed || 'trial_expires_at'::text; end if;
  if new.trial_granted_at     is distinct from old.trial_granted_at
    then changed := changed || 'trial_granted_at'::text; end if;
  if new.permanent_granted_at is distinct from old.permanent_granted_at
    then changed := changed || 'permanent_granted_at'::text; end if;
  if new.permanent_granted_by is distinct from old.permanent_granted_by
    then changed := changed || 'permanent_granted_by'::text; end if;
  -- family: the family link is owner-granted, in either direction.
  if new.family_of is distinct from old.family_of
    then changed := changed || 'family_of'::text; end if;

  -- subscription_status confers access, so it is billing-owned, not member-owned.
  if to_jsonb(new) ? 'subscription_status'
     and (to_jsonb(new)->>'subscription_status')
         is distinct from (to_jsonb(old)->>'subscription_status')
    then changed := changed || 'subscription_status'::text; end if;

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
$function$;

-- 3. Owner actions -----------------------------------------------------------
create or replace function private.grant_family_access(p_uid uuid, p_attested_adult boolean default false)
 returns jsonb
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
declare
  t      public.profiles%rowtype;
  basis  text;
  dob_v  date;
  detail text;
begin
  if not exists (select 1 from public.platform_owners where user_id = auth.uid()) then
    return jsonb_build_object('ok',false,'error','forbidden');
  end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    return jsonb_build_object('ok',false,'error','aal2_required');
  end if;

  select * into t from public.profiles where id = p_uid;

  if not found or p_uid = auth.uid() or coalesce(t.is_owner,false) then
    insert into public.access_grant_audit(action,actor_uid,target_uid,allowed,detail)
    values('grant_family_access',auth.uid(),p_uid,false,
           jsonb_build_object('refused','target_not_found_self_or_owner')::text);
    return jsonb_build_object('ok',false,'error','target_not_found_self_or_owner');
  end if;

  -- Best-effort age check: both dates are member-writable, so they are recorded,
  -- not trusted. A recorded date under 18 refuses; no date means the owner
  -- attested adulthood in the confirm dialog.
  dob_v := coalesce(t.dob, t.birth_date);
  basis := case
    when dob_v is null and coalesce(p_attested_adult,false) then 'owner_attested_adult'
    when dob_v is null then 'missing_date_unattested'
    else 'date_of_birth'
  end;
  detail := jsonb_build_object(
    'dob',t.dob,'birth_date',t.birth_date,'age_basis',basis,
    'owner_attested_adult',coalesce(p_attested_adult,false)
  )::text;

  if dob_v is null and not coalesce(p_attested_adult,false) then
    insert into public.access_grant_audit(action,actor_uid,target_uid,allowed,detail)
    values('grant_family_access',auth.uid(),p_uid,false,detail);
    return jsonb_build_object('ok',false,'error','adult_attestation_required');
  end if;

  if dob_v is not null and dob_v > (current_date - interval '18 years') then
    insert into public.access_grant_audit(action,actor_uid,target_uid,allowed,detail)
    values('grant_family_access',auth.uid(),p_uid,false,detail);
    return jsonb_build_object('ok',false,'error','minor_by_dob');
  end if;

  -- A link already held by any owner account is kept; access fields are
  -- written again either way, so a revoked family member can be restored.
  update public.profiles
     set access_approved = true, is_trial = false, is_rejected = false,
         trial_expires_at = null,
         family_of = coalesce(family_of, auth.uid())
   where id = p_uid and coalesce(is_owner,false) = false;

  -- Snapshot rows written before the grant must not outlive it.
  delete from public.leaderboard_snapshots where user_id = p_uid;

  insert into public.notifications(user_id,notification_type,message)
  values(p_uid,'access_granted','Family access has been granted. Welcome home.');

  insert into public.access_grant_audit(action,actor_uid,target_uid,allowed,detail)
  values('grant_family_access',auth.uid(),p_uid,true,detail);

  return jsonb_build_object('ok',true,'uid',p_uid,'family',true,'age_basis',basis);
end;
$function$;

create or replace function private.revoke_family_link(p_uid uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
begin
  if not exists (select 1 from public.platform_owners where user_id = auth.uid()) then
    return jsonb_build_object('ok',false,'error','forbidden');
  end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    return jsonb_build_object('ok',false,'error','aal2_required');
  end if;

  -- Clears the link only; access stays until the owner uses revoke_member.
  update public.profiles set family_of = null
   where id = p_uid and family_of is not null;

  if not found then
    return jsonb_build_object('ok',false,'error','not_linked');
  end if;

  insert into public.access_grant_audit(action,actor_uid,target_uid,allowed,detail)
  values('revoke_family_link',auth.uid(),p_uid,true,'family link cleared');

  return jsonb_build_object('ok',true,'uid',p_uid,'family',false);
end;
$function$;

create or replace function public.grant_family_access(p_uid uuid, p_attested_adult boolean default false)
 returns jsonb
 language sql
 set search_path = 'public', 'pg_temp'
as $function$ SELECT private.grant_family_access($1, $2) $function$;

create or replace function public.revoke_family_link(p_uid uuid)
 returns jsonb
 language sql
 set search_path = 'public', 'pg_temp'
as $function$ SELECT private.revoke_family_link($1) $function$;

revoke all on function private.grant_family_access(uuid, boolean) from public, anon;
revoke all on function private.revoke_family_link(uuid)  from public, anon;
revoke all on function public.grant_family_access(uuid, boolean)  from public, anon;
revoke all on function public.revoke_family_link(uuid)   from public, anon;
grant execute on function private.grant_family_access(uuid, boolean) to authenticated;
grant execute on function private.revoke_family_link(uuid)  to authenticated;
grant execute on function public.grant_family_access(uuid, boolean)  to authenticated, service_role;
grant execute on function public.revoke_family_link(uuid)   to authenticated, service_role;

-- 4. Member-visible lists exclude family ----------------------------------------
create or replace function private.public_leaderboard(p_limit integer default 50)
 returns jsonb
 language sql
 stable security definer
 set search_path = 'public'
as $function$
  WITH ranked AS (
    SELECT
      COALESCE(NULLIF(btrim(display_name),''), 'Initiate-' || substr(id::text,1,4)) AS nm,
      sign, element,
      round(GREATEST(COALESCE(axis_a,0.001),0.001),3) AS a,
      round(GREATEST(COALESCE(axis_b,0.001),0.001),3) AS b,
      round(GREATEST(COALESCE(axis_c,0.001),0.001),3) AS c,
      public.compute_authority(axis_a,axis_b,axis_c,is_owner) AS auth_v,
      COALESCE(certificates_earned,0) AS cert,
      COALESCE(trophies_earned,0)     AS tro,
      COALESCE(medals_earned,0)       AS med,
      COALESCE(is_owner,false)        AS is_owner,
      created_at
    FROM public.profiles
    WHERE (COALESCE(access_approved,false) OR COALESCE(is_owner,false))
      AND family_of IS NULL  -- family: never ranked where members can see
  ),
  numbered AS (
    SELECT *, row_number() OVER (ORDER BY auth_v DESC, created_at ASC NULLS LAST) AS rnk
    FROM ranked
    ORDER BY auth_v DESC, created_at ASC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit,50), 200))
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rank',         rnk,
    'name',         nm,
    'sign',         sign,
    'element',      element,
    'axis_a',       a,
    'axis_b',       b,
    'axis_c',       c,
    'authority',    auth_v,
    'certificates', cert,
    'trophies',     tro,
    'medals',       med,
    'is_owner',     is_owner
  ) ORDER BY rnk), '[]'::jsonb)
  FROM numbered;
$function$;


-- Points leaderboard: retain a member's own row, but never expose another
-- linked family member in a member-visible ranking. The predicate runs before
-- row_number(), so excluded family rows cannot distort other members' ranks.
create or replace function public.get_points_leaderboard(p_limit integer default 10)
 returns table(rank integer, display_name text, element text, sign text, level integer, lifetime_points integer, is_self boolean)
 language plpgsql
 stable
 set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then return; end if;
  return query
  with totals as (
    select l.user_id, coalesce(sum(l.delta) filter (where l.delta > 0), 0)::int as pts
      from public.sovereign_points_ledger l group by l.user_id
  )
  select (row_number() over (order by t.pts desc, p.id))::int,
         coalesce(nullif(btrim(p.display_name), ''), 'MEMBER'),
         p.element, p.sign, (floor(sqrt(t.pts / 25.0))::int + 1), t.pts, (p.id = v_uid)
    from totals t join public.profiles p on p.id = t.user_id
    where t.pts > 0
      and (p.is_public is true or p.id = v_uid)
      and (p.access_approved is true or p.is_owner is true)
      and p.deactivated_at is null
      and (p.family_of is null or p.id = v_uid) -- family: only self may see self
    order by t.pts desc, p.id
    limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$function$;

-- Daily snapshot recomputation must not reintroduce linked family accounts
-- after grant_family_access deletes their pre-existing snapshot rows.
create or replace function public.compute_leaderboard_snapshot()
 returns void
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
DECLARE
  _PHI constant numeric := 1.6180339887;
  _EU  constant numeric := 2.7182818285;
BEGIN
  INSERT INTO public.leaderboard_snapshots(user_id,snapshot_date,authority,axis_a,axis_b,axis_c)
  SELECT
    id,
    CURRENT_DATE,
    SQRT(POWER(axis_a,3)+POWER(axis_b,3)+POWER(axis_c,3))*_PHI/_EU,
    axis_a, axis_b, axis_c
  FROM public.profiles
  WHERE (access_approved=true OR is_owner=true)
    AND family_of IS NULL -- family: do not snapshot linked members
  ON CONFLICT(user_id,snapshot_date) DO UPDATE SET
    authority=EXCLUDED.authority,
    axis_a=EXCLUDED.axis_a,
    axis_b=EXCLUDED.axis_b,
    axis_c=EXCLUDED.axis_c;
  /* Compute global ranks */
  WITH ranked AS(
    SELECT user_id, ROW_NUMBER() OVER(ORDER BY authority DESC) as rk
    FROM public.leaderboard_snapshots WHERE snapshot_date=CURRENT_DATE
  )
  UPDATE public.leaderboard_snapshots ls SET rank_global=r.rk
  FROM ranked r WHERE ls.user_id=r.user_id AND ls.snapshot_date=CURRENT_DATE;
END;
$function$;


-- Invoker: under self-or-owner profiles RLS the inner join already drops other
-- members' rows, so this predicate changes nothing today. It is defence in
-- depth for the day the function or the policy changes, not the guarantee.
-- The member-visible name paths that DO need the filter are
-- private.public_leaderboard (above) and the service-role Edge Functions
-- rankings and snapshot-leaderboard.
create or replace function public.get_activity_feed(p_limit integer default 20, p_offset integer default 0)
 returns table(id uuid, user_id uuid, display_name text, element text, activity_type text, title text, body text, metadata jsonb, created_at timestamp with time zone)
 language sql
 stable
 set search_path = ''
as $function$
  SELECT af.id, af.user_id, pr.display_name, pr.element, af.activity_type, af.title, af.body, af.metadata, af.created_at
  FROM public.activity_feed af
  JOIN public.profiles pr ON pr.id=af.user_id
  WHERE af.is_public=true
    AND pr.family_of IS NULL  -- family: never listed where members can see
  ORDER BY af.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- 5. Owner list carries the link (no filter: the owner sees family) ------------
create or replace function private.get_all_members()
 returns jsonb
 language plpgsql
 security definer
 set search_path = 'public'
as $function$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(row ORDER BY ord),'[]'::jsonb) INTO result FROM (
    SELECT
      CASE WHEN COALESCE(p.access_approved,false)=false AND COALESCE(p.is_rejected,false)=false THEN 0
           WHEN COALESCE(p.is_trial,false) THEN 1 ELSE 2 END AS ord,
      jsonb_build_object(
        'id',                p.id,
        'email',             u.email,
        'display_name',      p.display_name,
        'sign',              p.sign,
        'element',           p.element,
        'axis_a',            GREATEST(COALESCE(p.axis_a,0.001),0.001),
        'axis_b',            GREATEST(COALESCE(p.axis_b,0.001),0.001),
        'axis_c',            GREATEST(COALESCE(p.axis_c,0.001),0.001),
        'authority',         public.compute_authority(p.axis_a,p.axis_b,p.axis_c,p.is_owner),
        'is_owner',          COALESCE(p.is_owner,false),
        'access_approved',   COALESCE(p.access_approved,false),
        'is_trial',          COALESCE(p.is_trial,false),
        'is_rejected',       COALESCE(p.is_rejected,false),
        'trial_expires_at',  p.trial_expires_at,
        'membership_tier',   p.membership_tier,
        'material_tier',     p.material_tier,
        'certificates_earned', COALESCE(p.certificates_earned,0),
        'created_at',        p.created_at,
        'subscription_tier', p.subscription_tier,
        'family_of',         p.family_of  -- family: owner sees the link
      ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) q;
  RETURN result;
END;
$function$;
