-- ============================================================================
-- SYD OMEGA 91717 -- LIVE EVOLUTION ENGINE
-- The functions the pages already call. Creating them brings the 729-matrix
-- to life: actions -> evolution_events -> authority recalculation -> milestones.
--
-- Contract (mapped from the live pages, do not change names/params):
--   complete_task(p_kind, p_task, p_axis, p_title)  <- academy / gaming /
--                                                       contributions / publishing
--   log_evolution(p_axis, p_note)                   <- account
--   get_all_members()                               <- approvals / profile
--   approve_member(p_uid) / reject_member / revoke_member <- approvals
--   order_stats()                                   <- hall
--
-- Rules baked in (match what the pages display):
--   baseline axis = 1, apex = 9, each cleared node = +0.25 on its axis
--   one node counts once (dedup on task_completions.task)
--   authority = sqrt(a^2 + b^2 + c^2),  apex authority = 15.588
--   integer crossings award: axis a -> Certificate, b -> Trophy, c -> Medal
--   composite nodes (3,3,3)/(6,6,6)/(9,9,9) open Gates
--
-- Safe + re-runnable. Run AFTER OMEGA_BACKEND_SYNC.sql. Pure ASCII.
-- ============================================================================
BEGIN;

-- --- ensure the derived columns the engine maintains exist ------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS authority        numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trophies_earned  int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_earned    int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nodes_cleared    int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificates_earned int  DEFAULT 0;

-- dedup guard: a node can be banked only once per member
CREATE UNIQUE INDEX IF NOT EXISTS task_completions_user_task_uniq
  ON public.task_completions(user_id, task);

-- --- drop prior versions of these functions ---------------------------------
-- An earlier build may have created these with a different return type, and
-- CREATE OR REPLACE cannot change a return type. Drop every old overload first.
-- is_platform_owner() is intentionally NOT dropped: RLS policies may depend on
-- it and its boolean return type is unchanged, so CREATE OR REPLACE handles it.
DO $drop$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'DROP FUNCTION IF EXISTS public.' || quote_ident(p.proname)
           || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS cmd
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('complete_task','log_evolution','get_all_members',
                        'approve_member','reject_member','revoke_member','order_stats')
  LOOP
    EXECUTE r.cmd;
  END LOOP;
END
$drop$;

-- ----------------------------------------------------------------------------
-- helper: am I the platform owner?
-- ----------------------------------------------------------------------------
-- Recursion-safe owner check.
-- profiles RLS policies call is_platform_owner(); if this function read
-- public.profiles it would re-trigger those policies -> "infinite recursion
-- detected in policy for relation profiles" -> every page breaks.
-- platform_owners is a tiny RLS-free lookup table that breaks that loop.
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false)=true
  ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_owners_read ON public.platform_owners;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- complete_task -- the heartbeat of the matrix
-- Returns jsonb: { applied, axis, value, a, b, c, authority, unlocked[] }
--   applied=false means the node was already yours (no double-count).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax text := lower(coalesce(p_axis,'a'));
  w numeric := coalesce(p_weight,0.25);
  a numeric; b numeric; c numeric;
  old_v numeric; new_v numeric;
  old_m int; new_m int; k int;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('applied',false,'error','not authenticated'); END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles SET axis_a=COALESCE(axis_a,1), axis_b=COALESCE(axis_b,1), axis_c=COALESCE(axis_c,1) WHERE id=uid;

  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id=uid AND task=p_task) THEN
    SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);
    RETURN jsonb_build_object('applied',false,'axis',ax,
      'value',CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id,task,kind) VALUES (uid,p_task,p_kind);

  SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  IF ax='a' THEN a:=new_v; ELSIF ax='b' THEN b:=new_v; ELSE c:=new_v; END IF;
  auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);

  INSERT INTO public.evolution_events (user_id,axis,note)
    VALUES (uid,ax,COALESCE(p_title,p_kind||' / '||p_task));

  -- light any newly reached milestones on this track (curated 1..12)
  old_m := public.milestones_for_axis(old_v);
  new_m := public.milestones_for_axis(new_v);
  IF new_m > old_m THEN
    FOR k IN (old_m+1)..new_m LOOP
      IF ax='a' THEN
        INSERT INTO public.certificates (user_id,title,milestone,cert_num)
          SELECT uid, COALESCE(p_title,'Sovereign Certificate '||k), k, k
          WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id=uid AND cert_num=k);
        unlocked := unlocked || jsonb_build_object('type','certificate','n',k);
      ELSIF ax='b' THEN
        INSERT INTO public.trophies (user_id,trophy_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.trophies WHERE user_id=uid AND trophy_num=k);
        unlocked := unlocked || jsonb_build_object('type','trophy','n',k);
      ELSE
        INSERT INTO public.medals (user_id,medal_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.medals WHERE user_id=uid AND medal_num=k);
        unlocked := unlocked || jsonb_build_object('type','medal','n',k);
      END IF;
    END LOOP;
  END IF;

  -- composite gate at (3,3,3)/(6,6,6)/(9,9,9)
  IF floor(a)=floor(b) AND floor(b)=floor(c) AND floor(new_v) IN (3,6,9)
     AND floor(new_v) > floor(old_v) THEN
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
  END IF;

  UPDATE public.profiles SET
    axis_a=a, axis_b=b, axis_c=c, authority=auth_v,
    nodes_earned        = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    nodes_cleared       = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id=uid),
    trophies_earned     = (SELECT count(*) FROM public.trophies WHERE user_id=uid AND trophy_num IS NOT NULL),
    medals_earned       = (SELECT count(*) FROM public.medals WHERE user_id=uid)
  WHERE id=uid;

  RETURN jsonb_build_object('applied',true,'axis',ax,'value',new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
END;
$$;

-- ----------------------------------------------------------------------------
-- log_evolution -- manual axis advance from the account console
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_evolution(p_axis text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN public.complete_task(
    'manual',
    'manual-' || replace(gen_random_uuid()::text,'-',''),
    p_axis,
    COALESCE(p_note,'Manual evolution'),
    0.25);
END;
$$;

-- ----------------------------------------------------------------------------
-- get_all_members -- owner-only roster with email + standing
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(row ORDER BY ord),'[]'::jsonb) INTO result FROM (
    SELECT
      -- pending first, then trials, then the rest; newest within each
      CASE WHEN COALESCE(p.access_approved,false)=false AND COALESCE(p.is_rejected,false)=false THEN 0
           WHEN COALESCE(p.is_trial,false) THEN 1 ELSE 2 END AS ord,
      jsonb_build_object(
        'id', p.id, 'email', u.email, 'display_name', p.display_name,
        'sign', p.sign, 'element', p.element,
        'axis_a', COALESCE(p.axis_a,1), 'axis_b', COALESCE(p.axis_b,1), 'axis_c', COALESCE(p.axis_c,1),
        'authority', round(sqrt(power(COALESCE(p.axis_a,1),2)+power(COALESCE(p.axis_b,1),2)+power(COALESCE(p.axis_c,1),2))::numeric,3),
        'is_owner', COALESCE(p.is_owner,false),
        'access_approved', COALESCE(p.access_approved,false),
        'is_trial', COALESCE(p.is_trial,false),
        'is_rejected', COALESCE(p.is_rejected,false),
        'trial_expires_at', p.trial_expires_at,
        'membership_tier', p.membership_tier, 'material_tier', p.material_tier,
        'certificates_earned', COALESCE(p.certificates_earned,0),
        'created_at', p.created_at
      ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) q;
  RETURN result;
END;
$$;

-- ----------------------------------------------------------------------------
-- approve / reject / revoke member -- owner-only gate control
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE exp timestamptz;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  exp := now() + public.trial_length();
  UPDATE public.profiles
     SET access_approved=true, is_trial=true, is_rejected=false, trial_expires_at=exp
   WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'is_trial',true,'trial_expires_at',exp,'minutes',9.1717);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, is_rejected=true, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'rejected',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'revoked',true);
END;
$$;

-- ----------------------------------------------------------------------------
-- order_stats -- the Hall scoreboard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el, cnt) FROM (
                       SELECT initcap(element) AS el, count(*) AS cnt
                       FROM public.profiles WHERE element IS NOT NULL AND btrim(element) <> ''
                       GROUP BY initcap(element)
                     ) e), '{}'::jsonb)
  ) INTO r;
  RETURN r;
END;
$$;

-- ----------------------------------------------------------------------------
-- grants -- the pages call these as authenticated users (anon for safety)
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_evolution(text,text)                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_all_members()                           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid)                        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid)                         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid)                         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()                              TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner()                         TO authenticated, anon;

COMMIT;

-- ============================================================================
-- TUNING NOTE
-- Every cleared node advances its axis by 0.25, so 32 nodes take an axis from
-- the baseline of 1 to the apex of 9. To slow the ascent (a longer journey to
-- sovereignty), lower the default in complete_task (e.g. 0.10) -- but keep it
-- matched to the "+0.25" text the pages display, or the on-screen number will
-- jump on reload. They are aligned at 0.25 right now.
-- ============================================================================
