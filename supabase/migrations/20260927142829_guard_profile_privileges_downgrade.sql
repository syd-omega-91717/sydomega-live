-- guard_profile_privileges(): typed literals + members may give access up.
-- Superseded the same day by 20260927143525_guard_profile_trial_expiry.sql,
-- which narrows the trial_expires_at rule; kept because it was applied live.
--
-- `changed := changed || 'access_approved'` appends an untyped literal to a
-- text[], so Postgres parses 'access_approved' as an ARRAY literal and raised
-- 22P02 "malformed array literal" -- on every member write that touched a
-- guarded column. The block still held (the statement failed), but so did
-- every legitimate self-downgrade: deactivate_account() and
-- request_account_erasure() both failed for every member (measured live).
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  is_owner_caller boolean;
  changed         text[] := '{}';
begin
  if auth.uid() is null then return new; end if;

  begin
    is_owner_caller := public.omega_is_owner();
  exception when others then
    is_owner_caller := false;
  end;

  if is_owner_caller then return new; end if;

  if coalesce(new.access_approved,false) and not coalesce(old.access_approved,false)
    then changed := changed || 'access_approved'::text; end if;
  if coalesce(new.is_trial,false) and not coalesce(old.is_trial,false)
    then changed := changed || 'is_trial'::text; end if;
  if coalesce(new.is_owner,false)             is distinct from coalesce(old.is_owner,false)
    then changed := changed || 'is_owner'::text; end if;
  if new.trial_expires_at is not null and new.trial_expires_at is distinct from old.trial_expires_at
    then changed := changed || 'trial_expires_at'::text; end if;
  if new.trial_granted_at     is distinct from old.trial_granted_at
    then changed := changed || 'trial_granted_at'::text; end if;
  if new.permanent_granted_at is distinct from old.permanent_granted_at
    then changed := changed || 'permanent_granted_at'::text; end if;
  if new.permanent_granted_by is distinct from old.permanent_granted_by
    then changed := changed || 'permanent_granted_by'::text; end if;

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

  if old.trial_started_at is not null
     and new.trial_started_at is distinct from old.trial_started_at then
    raise exception 'Not authorised: the approval window cannot be restarted.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
