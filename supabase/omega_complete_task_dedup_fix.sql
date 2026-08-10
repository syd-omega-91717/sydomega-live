-- ============================================================================
-- SYD OMEGA 91717 -- COMPLETE_TASK: PARAM RENAME BREAKAGE + MISSING DEDUP (CRITICAL)
--
-- Two independently confirmed bugs in the one live public.complete_task().
--
-- BUG 1 -- every client call site uses the wrong parameter names, so the RPC
-- has been failing platform-wide (not just in one page). The live signature
-- (confirmed via pg_get_functiondef() against production) is:
--   complete_task(p_task_name text, p_task_type text DEFAULT 'knowledge',
--                 p_axis_type text DEFAULT 'a', p_description text DEFAULT NULL,
--                 p_points numeric DEFAULT 0.001)
-- but every one of the 5 call sites in the client code uses an older
-- parameter naming (p_kind/p_task/p_axis/p_title/p_weight) that does not
-- exist on the live function:
--   omega-matrix.js:58-64        (window.omegaCompleteTask -- the core habit/
--                                 task-completion entry point loaded by bg.js)
--   omega-workflow.js:125-127    (increment_axis workflow step)
--   omega-workflow.js:215-221    (award_axis_c / dedication workflow step)
--   omega-progress.js:114-120    (OmegaProgress.record -- the shared bridge
--                                 academy/gaming/exam/contributions/publishing
--                                 all call to advance the matrix)
--   publishing.html:159          (first-publication Contribution-axis award)
-- Reproduced in a scratch PostgreSQL 16 instance with the live function body
-- verbatim: calling with the old parameter names raises
--   ERROR: function public.complete_task(p_kind => ..., p_task => ..., ...)
--   does not exist
-- i.e. every task completion, axis increment, authority-score update, and
-- nodes_earned counter has been silently failing everywhere on the platform
-- (all 5 call sites wrap the RPC in try/catch with a no-op/offline fallback,
-- so there is no visible error -- just permanently frozen progression).
-- Client-side fix for this half lives in the same commit as this file:
-- the 5 call sites above now send p_task_name/p_task_type/p_axis_type/
-- p_description/p_points.
--
-- BUG 2 -- once BUG 1's call sites are fixed, calls stop erroring and start
-- reaching this function for the first time in production -- which exposes
-- a second, previously-inert bug: this function's own DEDUPLICATION was
-- always missing. omega-progress.js's own header comment documents the
-- intended contract explicitly ("complete_task is keyed on (user, task), so
-- passing a stable task id means an action counts once no matter how many
-- times the page is re-submitted") and publishing.html's copy promises the
-- same ("This is farm-proof -- the axis advance only applies once"), and
-- every caller reads a `d.applied` boolean expecting exactly this semantic
-- (omega-workflow.js x2, omega-progress.js) -- but the live function body
-- has no dedup check anywhere; it unconditionally advances the axis and
-- inserts a task_completions row on every call. Reproduced in the scratch
-- instance: calling with the identical p_task_name twice produced two
-- separate axis increments and two task_completions rows, not one. Because
-- BUG 1 has silently no-opped every call up to now, this has not yet been
-- exploitable in production -- but shipping BUG 1's fix alone, without this
-- one, would newly expose real, unbounded score-farming (repeated clicks,
-- network retries, or a direct .rpc() call with the anon key repeating any
-- task_name indefinitely).
--
-- Fix (verified in the scratch instance: first call on a given task_name
-- applies and returns {"applied":true,...}; an immediate second call with
-- the same task_name is a no-op returning {"applied":false,...} with the
-- profile's current, unchanged axis values; task_completions ends up with
-- exactly one row for that task_name):
--   - Added an EXISTS check against task_completions(user_id, task_name)
--     before advancing anything, matching the (user, task) key the rest of
--     the codebase already assumes.
--   - Added `applied` to the returned jsonb (true/false) so the 3 call sites
--     that already read `d.applied` finally get a meaningful value instead
--     of always-undefined.
--   - Also fixes the two other client-side reads that no caller could ever
--     have exercised until BUG 1 is fixed: omega-matrix.js read
--     `d.a`/`d.b`/`d.c` from the RPC result, but the live function has
--     always returned `axis_a`/`axis_b`/`axis_c` -- fixed alongside the
--     param-name change in the same commit.
--   - Added a supporting index so the new EXISTS check doesn't degrade to a
--     sequential scan as task_completions grows.
--
-- Same signature as the live function (CREATE OR REPLACE, not a new
-- overload -- avoids repeating the exact ambiguity class fixed in
-- omega_apply_subscription_fix.sql). Idempotent, safe to re-run. Not yet
-- applied to the live database.
-- ============================================================================
BEGIN;

CREATE INDEX IF NOT EXISTS idx_task_completions_user_task
  ON public.task_completions (user_id, task_name);

CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_name text,
  p_task_type text DEFAULT 'knowledge'::text,
  p_axis_type text DEFAULT 'a'::text,
  p_description text DEFAULT NULL::text,
  p_points numeric DEFAULT 0.001
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid     uuid := auth.uid();
  pr      public.profiles%ROWTYPE;
  PHI     constant numeric := 1.6180339887;
  EU      constant numeric := 2.7182818285;
  APEX    constant numeric := 9.000;
  new_a   numeric; new_b numeric; new_c numeric; auth_score numeric;
BEGIN
  SELECT * INTO pr FROM public.profiles WHERE id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'applied', false, 'error', 'profile_not_found');
  END IF;
  IF NOT pr.access_approved AND NOT pr.is_owner THEN
    RETURN jsonb_build_object('ok', false, 'applied', false, 'error', 'access_denied');
  END IF;

  -- (user, task_name) dedup -- see BUG 2 above.
  IF EXISTS (
    SELECT 1 FROM public.task_completions
    WHERE user_id = uid AND task_name = p_task_name
  ) THEN
    RETURN jsonb_build_object(
      'ok', true, 'applied', false, 'axis_type', p_axis_type,
      'axis_a', pr.axis_a, 'axis_b', pr.axis_b, 'axis_c', pr.axis_c,
      'authority', pr.authority,
      'new_profile', row_to_json(pr)::jsonb
    );
  END IF;

  new_a := LEAST(APEX, COALESCE(pr.axis_a, 0.001));
  new_b := LEAST(APEX, COALESCE(pr.axis_b, 0.001));
  new_c := LEAST(APEX, COALESCE(pr.axis_c, 0.001));

  IF p_axis_type = 'a' THEN new_a := LEAST(APEX, new_a + p_points);
  ELSIF p_axis_type = 'b' THEN new_b := LEAST(APEX, new_b + p_points);
  ELSIF p_axis_type = 'c' THEN new_c := LEAST(APEX, new_c + p_points);
  END IF;

  auth_score := SQRT(POWER(new_a,3) + POWER(new_b,3) + POWER(new_c,3)) * PHI / EU;

  UPDATE public.profiles SET
    axis_a = new_a, axis_b = new_b, axis_c = new_c,
    authority = auth_score,
    nodes_earned = COALESCE(nodes_earned, 0) + 1
  WHERE id = uid;

  INSERT INTO public.task_completions(
    user_id, task_name, task_type, axis_type, description, points_earned,
    axis_a_before, axis_b_before, axis_c_before,
    axis_a_after, axis_b_after, axis_c_after, auth_after
  ) VALUES (
    uid, p_task_name, p_task_type, p_axis_type, p_description, p_points,
    pr.axis_a, pr.axis_b, pr.axis_c, new_a, new_b, new_c, auth_score
  );

  RETURN jsonb_build_object(
    'ok', true, 'applied', true, 'axis_type', p_axis_type,
    'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c,
    'authority', auth_score, 'points', p_points,
    'new_profile', row_to_json(pr)::jsonb || jsonb_build_object(
      'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c, 'authority', auth_score
    )
  );
END;
$function$;

COMMIT;
