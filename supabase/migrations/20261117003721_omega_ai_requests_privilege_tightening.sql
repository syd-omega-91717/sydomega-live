-- Ω SYD OMEGA 91717 — remove inherited table maintenance privileges.
-- PostgreSQL 17 exposes MAINTAIN separately; the original INSERT grant also
-- left TRUNCATE, REFERENCES, TRIGGER and MAINTAIN through the existing ACL.
-- Revoke every table privilege from client roles and service_role, then grant
-- the one operation required by metadata-only telemetry.

begin;
revoke all privileges on table public.omega_ai_requests from anon, authenticated, service_role;
grant insert on table public.omega_ai_requests to service_role;

do $$
declare
  privilege_name text;
begin
  foreach privilege_name in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] loop
    if privilege_name = 'INSERT' then
      if not has_table_privilege('service_role', 'public.omega_ai_requests', privilege_name) then
        raise exception 'omega_ai_requests_service_role_insert_missing';
      end if;
    elsif has_table_privilege('service_role', 'public.omega_ai_requests', privilege_name) then
      raise exception 'omega_ai_requests_service_role_privilege_too_broad: %', privilege_name;
    end if;
    if has_table_privilege('anon', 'public.omega_ai_requests', privilege_name)
       or has_table_privilege('authenticated', 'public.omega_ai_requests', privilege_name) then
      raise exception 'omega_ai_requests_client_privilege_must_remain_denied: %', privilege_name;
    end if;
  end loop;
  if not (select relrowsecurity from pg_class where oid='public.omega_ai_requests'::regclass) then
    raise exception 'omega_ai_requests_rls_must_remain_enabled';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='omega_ai_requests'
      and policyname='omega_deny_by_default'
      and roles @> array['anon','authenticated']::name[]
      and cmd='ALL' and qual='false' and with_check='false'
  ) then
    raise exception 'omega_ai_requests_client_deny_policy_missing';
  end if;
end;
$$;
commit;
