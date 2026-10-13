-- Public RPC bridge for the recovery-checkpoint functions.
--
-- recovery.html (omega-recovery.js) calls sb.rpc('omega_create_recovery_checkpoint')
-- and sb.rpc('omega_verify_recovery_checkpoint'). PostgREST resolves those in the
-- public schema, but migrations 20260929115839 / 20260929120017 / 20260929120620
-- created them only in private -- so both buttons failed for every member
-- (function not found), live-verified 2026-10-12.
--
-- Same shape as 20260929092815_omega_mission_public_rpc_bridge: a SECURITY INVOKER
-- SQL wrapper that adds no privilege of its own. The private functions are
-- SECURITY DEFINER with search_path = '' and enforce everything themselves:
-- auth.uid() required, create writes and counts only the caller's own rows, verify
-- reads only member_id = auth.uid(), the checkpoint key is validated.
-- EXECUTE is granted to PUBLIC by default on CREATE FUNCTION (CLAUDE.md 8.1 class
-- 6a), so it is revoked from public and anon before granting authenticated.

create or replace function public.omega_create_recovery_checkpoint(p_checkpoint_key text)
returns public.omega_recovery_checkpoints
language sql
security invoker
set search_path = ''
as $$
  select private.omega_create_recovery_checkpoint($1);
$$;

create or replace function public.omega_verify_recovery_checkpoint(p_checkpoint_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.omega_verify_recovery_checkpoint($1);
$$;

revoke execute on function public.omega_create_recovery_checkpoint(text) from public, anon;
revoke execute on function public.omega_verify_recovery_checkpoint(uuid) from public, anon;
grant execute on function public.omega_create_recovery_checkpoint(text) to authenticated;
grant execute on function public.omega_verify_recovery_checkpoint(uuid) to authenticated;
