-- Ω SYD OMEGA 91717 — metadata-only AI usage telemetry
-- The deployed concierge uses a service-role client to INSERT one bounded
-- OmegaAiUsageRecord into omega_ai_requests. The table is RLS-enabled with a
-- deny-by-default policy for anon/authenticated, but service_role had no table
-- INSERT privilege, so the live Edge Function raised ai_telemetry_write_failed.
-- Grant INSERT only. No SELECT, UPDATE, DELETE, TRUNCATE, or client-role access.
begin;

grant insert on table public.omega_ai_requests to service_role;

do $$
begin
  if not has_table_privilege('service_role', 'public.omega_ai_requests', 'INSERT') then
    raise exception 'omega_ai_requests_service_role_insert_grant_missing';
  end if;
  if has_table_privilege('service_role', 'public.omega_ai_requests', 'SELECT')
     or has_table_privilege('service_role', 'public.omega_ai_requests', 'UPDATE')
     or has_table_privilege('service_role', 'public.omega_ai_requests', 'DELETE') then
    raise exception 'omega_ai_requests_service_role_privilege_too_broad';
  end if;
  if has_table_privilege('anon', 'public.omega_ai_requests', 'INSERT')
     or has_table_privilege('authenticated', 'public.omega_ai_requests', 'INSERT') then
    raise exception 'omega_ai_requests_client_insert_must_remain_denied';
  end if;
end;
$$;

commit;
