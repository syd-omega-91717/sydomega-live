-- Ω CREATION LAYER — table-level grants (CLAUDE.md §8.1 class 6c).
--
-- 20261006150000_omega_creation_layer created four RLS-enabled tables with
-- owner policies but no GRANT. 20260903015535_harden_future_defaults_and_rls
-- revoked default table privileges from authenticated, and a GRANT is checked
-- before row security, so the policies never ran: measured live 2026-10-06,
-- omega_creation_surface() as a member raised
--   42501: permission denied for table omega_creative_projects.
--
-- authenticated only; anon stays without access. RLS (owner_id / user_id =
-- auth.uid()) remains the row boundary.
begin;
grant select, insert, update, delete on public.omega_creative_projects to authenticated;
grant select, insert, update, delete on public.omega_creative_assets to authenticated;
grant select, insert, update, delete on public.omega_experience_definitions to authenticated;
grant select, insert, update, delete on public.omega_experience_runs to authenticated;
commit;
