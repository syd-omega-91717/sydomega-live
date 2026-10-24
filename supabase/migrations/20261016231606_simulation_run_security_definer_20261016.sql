-- Ω SYD OMEGA 91717 — omega_record_simulation_run runs as definer again
-- Canonical source 20260929112443 declares it SECURITY DEFINER. Live-only
-- migration 20260930090758 (repo alias is a no-op) switched it to SECURITY
-- INVOKER and added policy omega_simulation_runs_insert_own without any
-- INSERT grant to authenticated, so every "save run" in the Simulation Arena
-- failed 42501 (§8.1 class 6c). Measured live 2026-10-16: prosecdef false,
-- authenticated INSERT false, 0 rows ever.
--
-- Same fix as world actions (20261016225535), not a table grant: the function
-- caps each snapshot at 12000 bytes and validates key/version/shape, which a
-- direct REST insert would skip (the table only checks key/version length).
-- search_path stays ''; EXECUTE stays authenticated-only.

begin;

alter function public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb)
  security definer set search_path = '';

revoke all on function public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb) from public, anon;
grant execute on function public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb) to authenticated;

commit;
