-- Ω SYD OMEGA 91717 — omega_record_world_action runs as definer again
-- Canonical source 20260929172000 declares it SECURITY DEFINER. Live migration
-- 20260930090758 (harden_user_rpc_security_invoker; its SQL never reached the
-- repo, only a no-op alias) switched it to SECURITY INVOKER and added the
-- policy omega_platform_events_insert_own, but no INSERT grant to
-- authenticated, so every member call fails 42501 (§8.1 class 6c). Measured
-- live 2026-10-16: prosecdef false, authenticated INSERT false.
--
-- A plain INSERT grant was rejected: it would let any member insert audit
-- rows of any event_type, actor_type or source through REST. As a definer the
-- function writes only 'action_started' for auth.uid() after validating every
-- input, so members get world actions and no direct write path to the audit
-- table. search_path stays pinned to ''; EXECUTE stays authenticated-only.

begin;

alter function public.omega_record_world_action(text, text, text, text)
  security definer set search_path = '';

revoke all on function public.omega_record_world_action(text, text, text, text) from public, anon;
grant execute on function public.omega_record_world_action(text, text, text, text) to authenticated;

commit;
