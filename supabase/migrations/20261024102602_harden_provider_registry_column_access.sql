-- Ω SYD OMEGA 91717
-- Provider registry is a capability catalog, not a client-readable credential store.
-- Runtime workers use service_role and server-side environment references.
-- Keep the existing RLS row boundary; authenticated clients receive only catalog fields.
-- secret_ref, metadata, created_at, and updated_at remain unavailable to authenticated.
-- This migration changes privileges only and does not rewrite application data.

begin;

revoke select on table public.omega_provider_registry from authenticated;
revoke select (secret_ref, metadata, created_at, updated_at) on table public.omega_provider_registry from authenticated;

grant select (
  id,
  provider_key,
  display_name,
  adapter_kind,
  capabilities,
  status
) on table public.omega_provider_registry to authenticated;

commit;
