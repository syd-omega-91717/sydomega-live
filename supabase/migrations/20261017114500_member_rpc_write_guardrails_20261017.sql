-- Ω SYD OMEGA 91717 — member-owned RPC write amplification guardrails
--
-- Keep the narrow SECURITY DEFINER write boundary because authenticated
-- clients intentionally have no direct INSERT privilege on the global event
-- ledger or simulation history. Pin the search path, enforce caller identity,
-- validate the current model contract, serialize per-member writes, and cap
-- per-member write rates.
BEGIN;

CREATE OR REPLACE FUNCTION public.omega_record_simulation_run(
  p_model_key text,
  p_model_version text,
  p_deterministic_seed bigint,
  p_input_snapshot jsonb,
  p_result_snapshot jsonb
)
RETURNS public.omega_simulation_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_row public.omega_simulation_runs;
  v_recent_count integer;
  v_metric text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING errcode = '28000';
  END IF;

  IF p_model_key IS NULL OR p_model_key NOT IN (
    'realm_balance',
    'mission_route',
    'arena_resilience'
  ) THEN
    RAISE EXCEPTION 'invalid_model_key' USING errcode = '22023';
  END IF;

  IF p_model_version IS NULL OR p_model_version <> '1.0.0' THEN
    RAISE EXCEPTION 'invalid_model_version' USING errcode = '22023';
  END IF;

  IF p_deterministic_seed IS NULL
     OR p_deterministic_seed NOT BETWEEN 1 AND 2147483647 THEN
    RAISE EXCEPTION 'invalid_deterministic_seed' USING errcode = '22023';
  END IF;

  IF p_input_snapshot IS NULL
     OR pg_catalog.jsonb_typeof(p_input_snapshot) <> 'object'
     OR NOT (p_input_snapshot ?& ARRAY['intensity', 'reserve', 'cycles']) THEN
    RAISE EXCEPTION 'invalid_input_snapshot' USING errcode = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(p_input_snapshot -> 'intensity') <> 'number'
     OR pg_catalog.jsonb_typeof(p_input_snapshot -> 'reserve') <> 'number'
     OR pg_catalog.jsonb_typeof(p_input_snapshot -> 'cycles') <> 'number' THEN
    RAISE EXCEPTION 'invalid_input_snapshot_types' USING errcode = '22023';
  END IF;

  IF (p_input_snapshot ->> 'intensity')::numeric NOT BETWEEN 1 AND 100
     OR (p_input_snapshot ->> 'reserve')::numeric NOT BETWEEN 10 AND 100
     OR (p_input_snapshot ->> 'cycles')::numeric NOT BETWEEN 3 AND 18
     OR (p_input_snapshot ->> 'cycles')::numeric <> trunc((p_input_snapshot ->> 'cycles')::numeric) THEN
    RAISE EXCEPTION 'input_snapshot_out_of_range' USING errcode = '22023';
  END IF;

  IF p_result_snapshot IS NULL
     OR pg_catalog.jsonb_typeof(p_result_snapshot) <> 'object'
     OR NOT (p_result_snapshot ?& ARRAY[
       'score', 'stability', 'adaptation', 'efficiency',
       'resilience', 'energy_remaining', 'trace'
     ]) THEN
    RAISE EXCEPTION 'invalid_result_snapshot' USING errcode = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(p_result_snapshot -> 'trace') <> 'array'
     OR pg_catalog.jsonb_array_length(p_result_snapshot -> 'trace') NOT BETWEEN 3 AND 18 THEN
    RAISE EXCEPTION 'invalid_result_trace' USING errcode = '22023';
  END IF;

  FOREACH v_metric IN ARRAY ARRAY[
    'score', 'stability', 'adaptation', 'efficiency', 'resilience', 'energy_remaining'
  ] LOOP
    IF pg_catalog.jsonb_typeof(p_result_snapshot -> v_metric) <> 'number' THEN
      RAISE EXCEPTION 'invalid_result_metric_type' USING errcode = '22023';
    END IF;
    IF (p_result_snapshot ->> v_metric)::numeric NOT BETWEEN 0 AND 100 THEN
      RAISE EXCEPTION 'result_metric_out_of_range' USING errcode = '22023';
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.jsonb_array_elements(p_result_snapshot -> 'trace') AS item(value)
    WHERE CASE
      WHEN pg_catalog.jsonb_typeof(item.value) = 'number'
        THEN (item.value #>> '{}')::numeric BETWEEN 0 AND 100
      ELSE false
    END IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'invalid_result_trace_values' USING errcode = '22023';
  END IF;

  IF pg_catalog.octet_length(p_input_snapshot::text) > 12000 THEN
    RAISE EXCEPTION 'input_snapshot_too_large' USING errcode = '22023';
  END IF;
  IF pg_catalog.octet_length(p_result_snapshot::text) > 12000 THEN
    RAISE EXCEPTION 'result_snapshot_too_large' USING errcode = '22023';
  END IF;

  -- Serialize writes per member so concurrent requests cannot bypass the cap.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':simulation-run', 0)
  );

  SELECT count(*)::integer
    INTO v_recent_count
    FROM public.omega_simulation_runs
   WHERE user_id = v_user_id
     AND created_at >= pg_catalog.now() - interval '1 hour';

  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'simulation_run_rate_limited' USING errcode = 'P0001';
  END IF;

  INSERT INTO public.omega_simulation_runs(
    user_id, model_key, model_version, deterministic_seed,
    input_snapshot, result_snapshot
  )
  VALUES (
    v_user_id, p_model_key, p_model_version, p_deterministic_seed,
    p_input_snapshot, p_result_snapshot
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb) TO authenticated;
COMMENT ON FUNCTION public.omega_record_simulation_run(text, text, bigint, jsonb, jsonb) IS
  'Intentional narrow SECURITY DEFINER write boundary: auth.uid enforced, pinned search_path, strict current simulation model/input/result validation, 20 runs per member per hour. No production balance or entitlement mutation.';

CREATE OR REPLACE FUNCTION public.omega_record_world_action(
  p_district text,
  p_action text,
  p_route text,
  p_idempotency_key text DEFAULT NULL::text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_id bigint;
  v_recent_count integer;
  v_district text := lower(trim(coalesce(p_district, '')));
  v_action text := lower(trim(coalesce(p_action, '')));
  v_route text := trim(coalesce(p_route, ''));
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING errcode = '42501';
  END IF;

  IF v_district NOT IN (
    'genesis', 'intelligence', 'academy', 'citadel', 'exchange',
    'heritage', 'wellness', 'arena', 'void'
  ) THEN
    RAISE EXCEPTION 'invalid district' USING errcode = '22023';
  END IF;

  IF v_action = '' OR length(v_action) > 80 THEN
    RAISE EXCEPTION 'invalid action' USING errcode = '22023';
  END IF;

  IF v_route !~ '^/[A-Za-z0-9_./?=&%-]{1,240}$' THEN
    RAISE EXCEPTION 'invalid route' USING errcode = '22023';
  END IF;

  IF p_idempotency_key IS NOT NULL
     AND (length(p_idempotency_key) < 8 OR length(p_idempotency_key) > 160) THEN
    RAISE EXCEPTION 'invalid idempotency key' USING errcode = '22023';
  END IF;

  -- The lock closes the check-then-insert race for duplicate client retries.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user::text || ':world-action', 0)
  );

  IF p_idempotency_key IS NOT NULL THEN
    SELECT e.id
      INTO v_id
      FROM public.omega_platform_events AS e
     WHERE e.actor_user_id = v_user
       AND e.event_type = 'action_started'
       AND e.metadata ->> 'idempotency_key' = p_idempotency_key
     LIMIT 1;

    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  SELECT count(*)::integer
    INTO v_recent_count
    FROM public.omega_platform_events AS e
   WHERE e.actor_user_id = v_user
     AND e.event_type = 'action_started'
     AND e.created_at >= pg_catalog.now() - interval '1 minute';

  IF v_recent_count >= 120 THEN
    RAISE EXCEPTION 'world_action_rate_limited' USING errcode = 'P0001';
  END IF;

  BEGIN
    INSERT INTO public.omega_platform_events(event_type, route, actor_user_id, metadata)
    VALUES (
      'action_started',
      v_route,
      v_user,
      pg_catalog.jsonb_build_object(
        'schema_version', '1',
        'district', v_district,
        'action', v_action,
        'idempotency_key', p_idempotency_key
      )
    )
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    -- The unique member/event/idempotency index remains the final race guard.
    IF p_idempotency_key IS NOT NULL THEN
      SELECT e.id
        INTO v_id
        FROM public.omega_platform_events AS e
       WHERE e.actor_user_id = v_user
         AND e.event_type = 'action_started'
         AND e.metadata ->> 'idempotency_key' = p_idempotency_key
       LIMIT 1;

      IF v_id IS NOT NULL THEN
        RETURN v_id;
      END IF;
    END IF;
    RAISE;
  END;

  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.omega_record_world_action(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.omega_record_world_action(text, text, text, text) TO authenticated;
COMMENT ON FUNCTION public.omega_record_world_action(text, text, text, text) IS
  'Intentional narrow SECURITY DEFINER write boundary: auth.uid enforced, pinned search_path, district/route validation, serialized idempotency, and 120 action-start events per member per minute. It cannot award XP, money, authority, or achievements.';

COMMIT;
