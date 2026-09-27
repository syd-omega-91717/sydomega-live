-- guard_profile_privileges(), final form. A member may LOWER their own
-- privileges (access_approved/is_trial to false; trial_expires_at cleared only
-- when the trial ends with it -- a live trial with no expiry would read as
-- unlimited) and may never raise them. Literals are typed (see
-- 20260927142829). Verified live, rolled back: a pending account setting
-- access_approved / is_trial / is_owner / trial_expires_at -> 42501 each; a
-- member on a live trial clearing its expiry -> 42501; deactivate_account()
-- and request_account_erasure() -> ok.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$
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
$$;
