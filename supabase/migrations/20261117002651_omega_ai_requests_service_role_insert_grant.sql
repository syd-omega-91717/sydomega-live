-- Ω SYD OMEGA 91717 — metadata-only AI usage telemetry schema and access boundary.
-- The production relation predates the repository migration chain. This source
-- baseline makes fresh replay deterministic and reproduces the live catalog.
-- Telemetry stores operational metadata only; never prompts, messages, memory,
-- credentials, or personal identifiers.

begin;

create table if not exists public.omega_ai_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null default gen_random_uuid(),
  agent_id text not null,
  prompt_version text not null,
  task text not null,
  risk text not null default 'low',
  provider text,
  model text,
  status text not null default 'queued',
  input_tokens integer default 0,
  output_tokens integer default 0,
  estimated_cost numeric(18,8) default 0,
  latency_ms integer,
  citations jsonb not null default '[]'::jsonb,
  evaluation jsonb not null default '{}'::jsonb,
  trace_id text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint omega_ai_requests_request_id_key unique (request_id),
  constraint omega_ai_requests_risk_check check (risk = any (array['low','medium','high']::text[])),
  constraint omega_ai_requests_status_check check (status = any (array['queued','running','completed','failed','blocked']::text[]))
);

create index if not exists omega_ai_requests_agent_idx
  on public.omega_ai_requests (agent_id, created_at desc);
create index if not exists omega_ai_requests_status_idx
  on public.omega_ai_requests (status, created_at desc);

alter table public.omega_ai_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='omega_ai_requests'
      and policyname='omega_deny_by_default'
  ) then
    create policy omega_deny_by_default
      on public.omega_ai_requests
      as permissive
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end;
$$;

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
