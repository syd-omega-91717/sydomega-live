-- Ω SYD OMEGA 91717
-- Keep provider credentials and internal metadata server-only.
--
-- omega_provider_registry is a readable capability catalog, not a credential
-- store. RLS continues to restrict which rows are visible; column privileges
-- restrict the visible fields. Runtime workers use server-side secrets.

BEGIN;

REVOKE SELECT ON TABLE public.omega_provider_registry FROM authenticated;
REVOKE SELECT (secret_ref, metadata, created_at, updated_at)
  ON TABLE public.omega_provider_registry FROM authenticated;

GRANT SELECT (
  id,
  provider_key,
  display_name,
  adapter_kind,
  capabilities,
  status
) ON TABLE public.omega_provider_registry TO authenticated;

COMMIT;
