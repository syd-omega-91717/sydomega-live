-- Recovered from supabase_migrations.schema_migrations on the live project
-- (ydqhzvvoyufiiqvzcjns) 2026-08-30: applied to production with no file in this
-- directory. Exact recorded statement, not a reconstruction.

BEGIN;

-- Helper function to format achievement notification messages.
-- (Optional: could inline into complete_task() instead of a separate function.
--  Kept separate for clarity and reusability if achievement logic expands.)
CREATE OR REPLACE FUNCTION public.notify_achievement(
  p_type text,  -- 'certificate' | 'trophy' | 'medal'
  p_num int
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_type
    WHEN 'certificate' THEN 'Certificate Earned: Knowledge ' || p_num
    WHEN 'trophy' THEN 'Trophy Unlocked: Mastery ' || p_num
    WHEN 'medal' THEN 'Medal Earned: Contribution ' || p_num
    ELSE 'Achievement Unlocked'
  END;
$$;

-- Replace complete_task() with full achievement-unlock logic + notifications.
-- Same parameter signature and basic flow as omega_complete_task_dedup_fix.sql,
-- but extended to compute and award milestones, and insert notifications.
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
  uid         uuid := auth.uid();
  pr          public.profiles%ROWTYPE;
  PHI         constant numeric := 1.6180339887;
  EU          constant numeric := 2.7182818285;
  APEX        constant numeric := 9.000;
  new_a       numeric; new_b numeric; new_c numeric; auth_score numeric;
  new_v       numeric; old_v numeric;
  old_m       int; new_m int; k int;
  unlocked    jsonb := '[]'::jsonb;
  notify_en   boolean;
  msg         text;
BEGIN
  SELECT * INTO pr FROM public.profiles WHERE id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'applied', false, 'error', 'profile_not_found');
  END IF;
  IF NOT pr.access_approved AND NOT pr.is_owner THEN
    RETURN jsonb_build_object('ok', false, 'applied', false, 'error', 'access_denied');
  END IF;

  -- (user, task_name) dedup check.
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

  -- Compute new axis values.
  new_a := LEAST(APEX, COALESCE(pr.axis_a, 0.001));
  new_b := LEAST(APEX, COALESCE(pr.axis_b, 0.001));
  new_c := LEAST(APEX, COALESCE(pr.axis_c, 0.001));

  IF p_axis_type = 'a' THEN new_a := LEAST(APEX, new_a + p_points);
  ELSIF p_axis_type = 'b' THEN new_b := LEAST(APEX, new_b + p_points);
  ELSIF p_axis_type = 'c' THEN new_c := LEAST(APEX, new_c + p_points);
  END IF;

  auth_score := SQRT(POWER(new_a,3) + POWER(new_b,3) + POWER(new_c,3)) * PHI / EU;

  -- Determine the axis value that changed, for milestone computation.
  old_v := CASE p_axis_type
    WHEN 'a' THEN pr.axis_a
    WHEN 'b' THEN pr.axis_b
    ELSE pr.axis_c
  END;
  new_v := CASE p_axis_type
    WHEN 'a' THEN new_a
    WHEN 'b' THEN new_b
    ELSE new_c
  END;

  -- Update profile.
  UPDATE public.profiles SET
    axis_a = new_a, axis_b = new_b, axis_c = new_c,
    authority = auth_score,
    nodes_earned = COALESCE(nodes_earned, 0) + 1
  WHERE id = uid;

  -- Insert task completion record.
  INSERT INTO public.task_completions(
    user_id, task_name, task_type, axis_type, description, points_earned,
    axis_a_before, axis_b_before, axis_c_before,
    axis_a_after, axis_b_after, axis_c_after, auth_after
  ) VALUES (
    uid, p_task_name, p_task_type, p_axis_type, p_description, p_points,
    pr.axis_a, pr.axis_b, pr.axis_c, new_a, new_b, new_c, auth_score
  );

  -- Check if notifications are enabled.
  SELECT notifications_enabled INTO notify_en FROM public.platform_settings LIMIT 1;
  notify_en := COALESCE(notify_en, false);

  -- Insert task-completion notification if enabled.
  IF notify_en THEN
    msg := 'Completed: ' || p_task_name;
    INSERT INTO public.notifications(user_id, notification_type, message)
      VALUES (uid, 'task_complete', msg);
  END IF;

  -- Compute and award milestones (achievements).
  old_m := public.milestones_for_axis(old_v);
  new_m := public.milestones_for_axis(new_v);
  IF new_m > old_m THEN
    FOR k IN (old_m+1)..new_m LOOP
      IF p_axis_type = 'a' THEN
        INSERT INTO public.certificates (user_id, title, cert_num)
          SELECT uid, 'Sovereign Certificate ' || k, k
          WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id=uid AND cert_num=k);
        unlocked := unlocked || jsonb_build_object('type', 'certificate', 'n', k);
        IF notify_en THEN
          INSERT INTO public.notifications(user_id, notification_type, message)
            VALUES (uid, 'achievement', public.notify_achievement('certificate', k));
        END IF;
      ELSIF p_axis_type = 'b' THEN
        INSERT INTO public.trophies (user_id, trophy_num)
          SELECT uid, k
          WHERE NOT EXISTS (SELECT 1 FROM public.trophies WHERE user_id=uid AND trophy_num=k);
        unlocked := unlocked || jsonb_build_object('type', 'trophy', 'n', k);
        IF notify_en THEN
          INSERT INTO public.notifications(user_id, notification_type, message)
            VALUES (uid, 'achievement', public.notify_achievement('trophy', k));
        END IF;
      ELSE  -- p_axis_type = 'c'
        INSERT INTO public.medals (user_id, medal_num)
          SELECT uid, k
          WHERE NOT EXISTS (SELECT 1 FROM public.medals WHERE user_id=uid AND medal_num=k);
        unlocked := unlocked || jsonb_build_object('type', 'medal', 'n', k);
        IF notify_en THEN
          INSERT INTO public.notifications(user_id, notification_type, message)
            VALUES (uid, 'achievement', public.notify_achievement('medal', k));
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Composite gate at (3,3,3)/(6,6,6)/(9,9,9).
  IF floor(new_a) = floor(new_b) AND floor(new_b) = floor(new_c)
     AND floor(new_v) IN (3, 6, 9) AND floor(new_v) > floor(old_v) THEN
    unlocked := unlocked || jsonb_build_object('type', 'gate', 'at', floor(new_v));
    IF notify_en THEN
      msg := 'Gate Unlocked: Level ' || floor(new_v);
      INSERT INTO public.notifications(user_id, notification_type, message)
        VALUES (uid, 'achievement', msg);
    END IF;
  END IF;

  -- Update milestone counters.
  UPDATE public.profiles SET
    certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id=uid),
    trophies_earned = (SELECT count(*) FROM public.trophies WHERE user_id=uid AND trophy_num IS NOT NULL),
    medals_earned = (SELECT count(*) FROM public.medals WHERE user_id=uid)
  WHERE id = uid;

  RETURN jsonb_build_object(
    'ok', true, 'applied', true, 'axis_type', p_axis_type,
    'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c,
    'authority', auth_score, 'points', p_points,
    'unlocked', unlocked,
    'new_profile', row_to_json(pr)::jsonb || jsonb_build_object(
      'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c, 'authority', auth_score
    )
  );
END;
$function$;

-- Grant execute permissions (same as original).
GRANT EXECUTE ON FUNCTION public.complete_task(text, text, text, text, numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.notify_achievement(text, int) TO authenticated, anon;

COMMIT;
