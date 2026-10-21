-- Ω SYD OMEGA 91717 — keep member write RPC implementations in omega_private.
--
-- The two public write RPCs must remain callable by authenticated members, but
-- their SECURITY DEFINER implementations should not live in the exposed public
-- schema. Move the existing, already-validated implementations into the private
-- schema and replace the public entrypoints with SECURITY INVOKER wrappers.
--
-- Preserve the implementation bodies and existing validation/rate limits by
-- moving the functions rather than copying/recreating their privileged logic.
-- omega_private must remain absent from Supabase's exposed API schemas.
--
-- The wrappers keep the public function names and argument contracts so the
-- static site and PostgREST callers remain compatible.

BEGIN;

ALTER FUNCTION public.omega_record_world_action(text, text, text, text)
  SET SCHEMA omega_private;

ALTER FUNCTION omega_private.omega_record_world_action(text, text, text, text)
  RENAME TO record_world_action_internal;

ALTER FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb)
  SET SCHEMA omega_private;

ALTER FUNCTION omega_private.omega_record_simulation_run(text, text, bigint, jsonb, jsonb)
  RENAME TO record_simulation_run_internal;

-- The invoker wrappers execute with the member's privileges, so schema usage
-- and execute rights are explicit. The private schema is not an API-exposed
-- schema; the internal implementations still validate auth.uid() themselves.
GRANT USAGE ON SCHEMA omega_private TO authenticated, service_role;

REVOKE ALL ON FUNCTION omega_private.record_world_action_internal(text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION omega_private.record_world_action_internal(text, text, text, text)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION omega_private.record_simulation_run_internal(text, text, bigint, jsonb, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION omega_private.record_simulation_run_internal(text, text, bigint, jsonb, jsonb)
  TO authenticated, service_role;

CREATE FUNCTION public.omega_record_world_action(
  p_district text,
  p_action text,
  p_route text,
  p_idempotency_key text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $wrapper$
BEGIN
  RETURN omega_private.record_world_action_internal(
    p_district,
    p_action,
    p_route,
    p_idempotency_key
  );
END;
$wrapper$;

CREATE FUNCTION public.omega_record_simulation_run(
  p_model_key text,
  p_model_version text,
  p_deterministic_seed bigint,
  p_input_snapshot jsonb,
  p_result_snapshot jsonb
)
RETURNS public.omega_simulation_runs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $wrapper$
BEGIN
  RETURN omega_private.record_simulation_run_internal(
    p_model_key,
    p_model_version,
    p_deterministic_seed,
    p_input_snapshot,
    p_result_snapshot
  );
END;
$wrapper$;

REVOKE ALL ON FUNCTION public.omega_record_world_action(text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.omega_record_world_action(text, text, text, text)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.omega_record_world_action(text, text, text, text) IS
  'Authenticated member entrypoint; SECURITY INVOKER wrapper for omega_private.record_world_action_internal.';

COMMENT ON FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb) IS
  'Authenticated member entrypoint; SECURITY INVOKER wrapper for omega_private.record_simulation_run_internal.';

COMMIT;
