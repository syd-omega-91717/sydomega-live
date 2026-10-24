-- Ω SYD OMEGA 91717
-- Do not expose provider secret references to authenticated clients.
--
-- The provider registry is a readable capability catalog, not a credential
-- store. Runtime workers use service_role and server-side environment secrets.
-- Keep the existing RLS row boundary while restricting authenticated SELECT to
-- the catalog fields that clients need. The secret_ref column remains
-- server-only. This migration changes privileges only; it does not rewrite data.

begin;

revoke select on table public.omega_provider_registry from authenticated;

grant select (
  id,
  provider_key,
  display_name,
  adapter_kind,
  capabilities,
  status,
  metadata,
  created_at,
  updated_at
) on table public.omega_provider_registry to authenticated;

commit;
