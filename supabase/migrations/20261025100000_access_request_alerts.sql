-- Ω SYD OMEGA 91717
-- Access-request alerts: the owner learns about new requests, and a member
-- learns when permanent access is granted.
--
-- Before this, four requests sat 100+ days unanswered: notify-access existed but
-- was never deployed, never authenticated, and nothing called it
-- (GAP_ANALYSIS.md §S, "access requests go unanswered").
--
-- 1. An owner in-app notification for every new request, in the same legacy
--    public.notifications table the bell on every page reads (siblings:
--    _notify_owner_member_approved / _notify_owner_member_rejected).
-- 2. An email dispatch through pg_net to the notify-access Edge Function, on
--    exactly two transitions:
--      access_requested  a new profile row (enforce_access_defaults makes
--                        every new profile a pending request)
--      access_granted    permanent access starts. A trial is deliberately not
--                        emailed: approve_member grants trial_length() (9m10s),
--                        which has expired before the email is read.
--
-- Secrets: the webhook secret is generated here into Vault and never leaves the
-- database except to notify-access, which reads it through
-- public.omega_notify_access_secret() (service_role only). The function URL is
-- written to Vault live, out of band, so a fresh replay (CI) has no URL and the
-- dispatch is a no-op.
--
-- Neither trigger can fail the write that fired it: every side effect sits in
-- an exception block that downgrades to a WARNING.

begin;

-- ── Vault: the shared webhook secret (created once, never overwritten) ──────
do $vault$
begin
  if not exists (select 1 from vault.secrets where name = 'notify_access_webhook_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'notify_access_webhook_secret',
      'Shared secret between the access-request dispatch trigger and the notify-access Edge Function'
    );
  end if;
end
$vault$;

-- ── 1. Owner in-app notification on a new request ───────────────────────────
create or replace function private._notify_owner_access_requested()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  begin
    insert into public.notifications (user_id, notification_type, message, content)
    select po.user_id,
           'access_requested',
           'New access request: ' || coalesce(nullif(new.display_name, ''), nullif(new.email, ''), 'a new member'),
           jsonb_build_object('member_id', new.id)::text
      from public.platform_owners po
     where po.user_id is distinct from new.id;
  exception when others then
    raise warning 'OMEGA_NOTIFY access_requested failed: % %', sqlstate, sqlerrm;
  end;
  return new;
end
$function$;

revoke all on function private._notify_owner_access_requested() from public, anon, authenticated;

drop trigger if exists notify_owner_access_requested on public.profiles;
create trigger notify_owner_access_requested
  after insert on public.profiles
  for each row execute function private._notify_owner_access_requested();

-- ── 2. Email dispatch to notify-access ──────────────────────────────────────
create or replace function private._dispatch_access_email()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_event  text;
  v_url    text;
  v_secret text;
  v_email  text;
begin
  if tg_op = 'INSERT' then
    v_event := 'access_requested';
  elsif new.access_approved is true
    and coalesce(new.is_trial, false) is false
    and coalesce(new.is_rejected, false) is false
    and coalesce(new.is_owner, false) is false
    and not (old.access_approved is true and coalesce(old.is_trial, false) is false) then
    v_event := 'access_granted';
  else
    return new;
  end if;

  begin
    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'notify_access_url';
    select decrypted_secret into v_secret
      from vault.decrypted_secrets where name = 'notify_access_webhook_secret';
    if v_url is null or v_secret is null then
      return new;  -- dormant: not configured in this database
    end if;

    v_email := coalesce(nullif(new.email, ''), (select u.email from auth.users u where u.id = new.id));

    perform net.http_post(
      url := v_url,
      body := jsonb_build_object(
        'event', v_event,
        'member', jsonb_build_object(
          'id', new.id,
          'display_name', new.display_name,
          'sign', new.sign,
          'email', v_email,
          'requested_at', coalesce(new.access_requested_at, new.created_at)
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-omega-webhook-secret', v_secret
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise warning 'OMEGA_NOTIFY % dispatch failed: % %', v_event, sqlstate, sqlerrm;
  end;
  return new;
end
$function$;

revoke all on function private._dispatch_access_email() from public, anon, authenticated;

drop trigger if exists dispatch_access_email on public.profiles;
create trigger dispatch_access_email
  after insert or update of access_approved, is_trial, is_rejected on public.profiles
  for each row execute function private._dispatch_access_email();

-- ── 3. notify-access reads the shared secret (service_role only) ────────────
create or replace function public.omega_notify_access_secret()
returns text
language plpgsql
stable
security definer
set search_path to ''
as $function$
begin
  -- Inside SECURITY DEFINER, current_user is the owner, so the caller is read
  -- from the request's JWT role. The EXECUTE grant below is the primary gate.
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  return (select decrypted_secret from vault.decrypted_secrets where name = 'notify_access_webhook_secret');
end
$function$;

revoke all on function public.omega_notify_access_secret() from public, anon, authenticated;
grant execute on function public.omega_notify_access_secret() to service_role;

commit;
