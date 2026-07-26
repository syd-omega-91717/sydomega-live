-- ============================================================================
-- SYD OMEGA 91717 — MATRIX PROGRESSION ENGINE
-- Dijkstra: optimal path 0.001→9.000 across 104,976 nodes per axis
-- Loop Engineering: every verified action fires complete_task()
-- Data Science: A=Knowledge B=Mastery C=Contribution → AUTH=sqrt(ΣCube³)×φ/e
-- ============================================================================

/* ── task_completions table ──────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS public.task_completions(
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_name     text NOT NULL,
  task_type     text NOT NULL DEFAULT 'knowledge',
  axis_type     text NOT NULL DEFAULT 'a' CHECK (axis_type IN ('a','b','c')),
  description   text,
  points_earned numeric(10,3) NOT NULL DEFAULT 0.001,
  axis_a_before numeric(10,3),
  axis_b_before numeric(10,3),
  axis_c_before numeric(10,3),
  axis_a_after  numeric(10,3),
  axis_b_after  numeric(10,3),
  axis_c_after  numeric(10,3),
  auth_after    numeric(12,6),
  completed_at  timestamptz NOT NULL DEFAULT now(),
  metadata      jsonb
);
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members see own tasks"   ON public.task_completions FOR SELECT USING (user_id=auth.uid());
CREATE POLICY "members insert own tasks" ON public.task_completions FOR INSERT WITH CHECK (user_id=auth.uid());
CREATE POLICY "owner sees all tasks"    ON public.task_completions FOR SELECT USING (public.is_platform_owner());

/* ── complete_task RPC ──────────────────────────────────────────────────── */
DROP FUNCTION IF EXISTS public.complete_task(text,text,text,text,numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_name   text,
  p_task_type   text DEFAULT 'knowledge',
  p_axis_type   text DEFAULT 'a',
  p_description text DEFAULT NULL,
  p_points      numeric DEFAULT 0.001
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid     uuid := auth.uid();
  pr      public.profiles%ROWTYPE;
  PHI     constant numeric := 1.6180339887;
  EU      constant numeric := 2.7182818285;
  APEX    constant numeric := 9.000;
  new_a   numeric; new_b numeric; new_c numeric; auth_score numeric;
BEGIN
  SELECT * INTO pr FROM public.profiles WHERE id=uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','profile_not_found'); END IF;
  IF NOT pr.access_approved AND NOT pr.is_owner THEN
    RETURN jsonb_build_object('ok',false,'error','access_denied');
  END IF;

  new_a := LEAST(APEX, COALESCE(pr.axis_a,0.001));
  new_b := LEAST(APEX, COALESCE(pr.axis_b,0.001));
  new_c := LEAST(APEX, COALESCE(pr.axis_c,0.001));

  IF p_axis_type='a' THEN new_a := LEAST(APEX, new_a + p_points);
  ELSIF p_axis_type='b' THEN new_b := LEAST(APEX, new_b + p_points);
  ELSIF p_axis_type='c' THEN new_c := LEAST(APEX, new_c + p_points);
  END IF;

  auth_score := SQRT(POWER(new_a,3)+POWER(new_b,3)+POWER(new_c,3))*PHI/EU;

  UPDATE public.profiles SET
    axis_a=new_a, axis_b=new_b, axis_c=new_c,
    authority=auth_score,
    nodes_earned=COALESCE(nodes_earned,0)+1
  WHERE id=uid;

  INSERT INTO public.task_completions(
    user_id,task_name,task_type,axis_type,description,points_earned,
    axis_a_before,axis_b_before,axis_c_before,
    axis_a_after,axis_b_after,axis_c_after,auth_after
  ) VALUES(
    uid,p_task_name,p_task_type,p_axis_type,p_description,p_points,
    pr.axis_a,pr.axis_b,pr.axis_c,new_a,new_b,new_c,auth_score
  );

  RETURN jsonb_build_object(
    'ok',true,'axis_type',p_axis_type,
    'axis_a',new_a,'axis_b',new_b,'axis_c',new_c,
    'authority',auth_score,'points',p_points,
    'new_profile',row_to_json(pr)::jsonb || jsonb_build_object(
      'axis_a',new_a,'axis_b',new_b,'axis_c',new_c,'authority',auth_score
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated;

/* ── get_my_task_log RPC ──────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.get_my_task_log(p_limit int DEFAULT 50)
RETURNS SETOF public.task_completions LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT * FROM public.task_completions
  WHERE user_id=auth.uid()
  ORDER BY completed_at DESC LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_task_log(int) TO authenticated;

/* ── add nodes_earned + authority columns if missing ─────────────────────── */
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nodes_earned   bigint  NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS authority       numeric(12,6);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status      text    DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio             text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS token           text;

SELECT 'MATRIX ENGINE READY' AS status,
       COUNT(*) AS task_completions
FROM public.task_completions;
