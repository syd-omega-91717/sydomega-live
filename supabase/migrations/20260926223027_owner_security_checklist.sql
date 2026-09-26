-- Owner Deck security checklist (control-plane.html). One read, one write,
-- both owner-only, in the shape every page-called RPC here already uses:
-- public SECURITY INVOKER wrapper -> private SECURITY DEFINER body, so the
-- exposed schema holds no definer function (security advisor lint 0029).
--
-- owner_security_status(): per owner, how many VERIFIED TOTP factors they
-- hold (auth.mfa_factors is not readable by the authenticated role; the
-- definer body reads it and returns a count, never a factor secret), the two
-- MFA flags, and when the owner last confirmed rotating third-party keys.
--
-- owner_confirm_secrets_rotated(): records that confirmation as a timestamp in
-- platform_settings.text_value. bool_value stays false, so the member-callable
-- get_platform_flag() reveals nothing about it; platform_settings SELECT is
-- already owner-only under RLS.
--
-- Both refuse non-owners with {ok:false,error:'forbidden'} rather than raising,
-- so the deck can show nothing instead of an error.
--
-- Verified live 2026-09-26 (one rolled-back block, SET LOCAL ROLE authenticated
-- + request.jwt.claims): a non-owner approved member got forbidden from both;
-- an owner got ok, 2 owners, 0 verified factors each, and a timestamp back from
-- the write; the member then read get_platform_flag('owner_secrets_rotated_at')
-- as false. anon holds EXECUTE on none of the four functions, and the security
-- advisor reported nothing new.

create or replace function private.owner_security_status()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_platform_owner() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  return jsonb_build_object(
    'ok', true,
    'owners', coalesce((
      select jsonb_agg(jsonb_build_object(
               'email', u.email,
               'me', po.user_id = auth.uid(),
               'factors', (select count(*) from auth.mfa_factors f
                            where f.user_id = po.user_id and f.status = 'verified'))
             order by u.email)
        from public.platform_owners po join auth.users u on u.id = po.user_id), '[]'::jsonb),
    'mfa_enrolment_enabled', private.get_platform_flag('mfa_enrolment_enabled'),
    'owner_mfa_required', private.get_platform_flag('owner_mfa_required'),
    'secrets_rotated_at', (select text_value from public.platform_settings
                            where key = 'owner_secrets_rotated_at'));
end $$;

create or replace function private.owner_confirm_secrets_rotated()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare ts text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
  if not private.is_platform_owner() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  insert into public.platform_settings(key, bool_value, text_value, updated_at)
  values ('owner_secrets_rotated_at', false, ts, now())
  on conflict (key) do update set bool_value = false, text_value = excluded.text_value, updated_at = now();
  return jsonb_build_object('ok', true, 'at', ts);
end $$;

create or replace function public.owner_security_status()
returns jsonb language sql stable security invoker set search_path = public, pg_temp
as $$ select private.owner_security_status() $$;

create or replace function public.owner_confirm_secrets_rotated()
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.owner_confirm_secrets_rotated() $$;

revoke execute on function private.owner_security_status() from public, anon;
revoke execute on function private.owner_confirm_secrets_rotated() from public, anon;
revoke execute on function public.owner_security_status() from public, anon;
revoke execute on function public.owner_confirm_secrets_rotated() from public, anon;
grant execute on function private.owner_security_status() to authenticated;
grant execute on function private.owner_confirm_secrets_rotated() to authenticated;
grant execute on function public.owner_security_status() to authenticated;
grant execute on function public.owner_confirm_secrets_rotated() to authenticated;
