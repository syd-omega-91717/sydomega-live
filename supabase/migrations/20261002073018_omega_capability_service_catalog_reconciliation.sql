begin;
-- Target-project capability/service schema reconciliation.
-- Canonical service catalog objects are intentionally idempotent.
-- Capability and service marketplace persistence.
-- Applied to Supabase project nvgedlxlkdzvcelimbvq on 2026-10-02.
-- Keep this migration idempotent for repository reproducibility.
create table if not exists public.omega_capabilities (
  capability_id text primary key, version text not null default '1.0.0', name text not null,
  capability_type text not null check (capability_type in ('PAGE','API','SERVICE','DATA_PRODUCT','AI_MODEL','AI_AGENT','TOOL','WORKFLOW','MEDIA_PIPELINE','PAYMENT_PRODUCT','ENTITLEMENT','INTEGRATION','REPORT','AUTOMATION')),
  module_id text, purpose text not null,
  lifecycle text not null default 'DESIGNED' check (lifecycle in ('PROPOSED','DESIGNED','BUILT','INTEGRATED','TESTED','DEPLOYED','VERIFIED','DEPRECATED')),
  audience text[] not null default '{}', authz text not null default 'DENY_BY_DEFAULT', data_class text not null default 'INTERNAL',
  inputs jsonb not null default '[]'::jsonb, outputs jsonb not null default '[]'::jsonb, dependencies jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb, rate_limit jsonb not null default '{}'::jsonb, cost_model jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb, rollback text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.omega_services (
  service_id text primary key, capability_id text references public.omega_capabilities(capability_id) on delete restrict, name text not null,
  service_family text not null check (service_family in ('INTELLIGENCE','PROFESSIONAL','KNOWLEDGE','CREATION','AUTOMATION','COMMUNITY','ENTERPRISE')),
  commercial_model text not null check (commercial_model in ('FREE','SUBSCRIPTION','USAGE','ONE_TIME','ENTERPRISE','MARKETPLACE')),
  status text not null default 'DESIGNED' check (status in ('PROPOSED','DESIGNED','BUILT','INTEGRATED','TESTED','DEPLOYED','VERIFIED','DISABLED')),
  description text not null, delivery_mode text not null default 'DIGITAL', policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.omega_service_orders (
  order_id uuid primary key default gen_random_uuid(), service_id text not null references public.omega_services(service_id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict, status text not null default 'PENDING',
  idempotency_key text not null unique, provider_reference text, entitlement_id uuid references public.omega_entitlements(entitlement_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists omega_capabilities_module_idx on public.omega_capabilities(module_id);
create index if not exists omega_capabilities_lifecycle_idx on public.omega_capabilities(lifecycle);
create index if not exists omega_services_family_idx on public.omega_services(service_family);
create index if not exists omega_service_orders_user_idx on public.omega_service_orders(user_id,status);
alter table public.omega_capabilities enable row level security;
alter table public.omega_services enable row level security;
alter table public.omega_service_orders enable row level security;
drop policy if exists omega_capabilities_authenticated_read on public.omega_capabilities;
create policy omega_capabilities_authenticated_read on public.omega_capabilities for select to authenticated using (true);
drop policy if exists omega_services_authenticated_read on public.omega_services;
create policy omega_services_authenticated_read on public.omega_services for select to authenticated using (true);
drop policy if exists omega_service_orders_owner_read on public.omega_service_orders;
create policy omega_service_orders_owner_read on public.omega_service_orders for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.omega_capabilities from anon;
revoke all on public.omega_services from anon;
revoke all on public.omega_service_orders from anon;
grant select on public.omega_capabilities, public.omega_services to authenticated;
grant select on public.omega_service_orders to authenticated;
grant all on public.omega_capabilities, public.omega_services, public.omega_service_orders to service_role;
commit;
