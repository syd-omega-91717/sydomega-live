-- ============================================================================
-- SYD OMEGA 91717 -- ACHIEVEMENT ALIGNMENT
-- Audit fix: the live pages expect a structure the engine did not produce.
--   trophies.html reads  .from('medals')            -> table did not exist
--   trophies.html reads  certificates.cert_num      -> column did not exist
--   honors.html  reads   profiles.nodes_earned      -> engine wrote nodes_cleared
--   pages show 12 curated trophies/medals/certificates, engine only made ~8
-- This aligns the schema + engine to the live pages. The 12 are a journey:
-- as each axis climbs 1 -> 9, that track lights its 12 milestones in order
-- (all 12 at the apex). Knowledge -> Certificates, Mastery -> Trophies,
-- Contribution -> Medals. Run AFTER the other SQL. Safe + re-runnable. ASCII.
-- ============================================================================
BEGIN;

-- 1) the medals table (mirrors trophies) ------------------------------------
-- NOTE: a medals table may already exist from an earlier step with a different
-- shape, so CREATE IF NOT EXISTS alone is not enough -- we also guarantee every
-- column the engine/pages need, whether the table is new or pre-existing.
CREATE TABLE IF NOT EXISTS public.medals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_num  int,
  earned_at  timestamptz DEFAULT now(),
  issued_at  timestamptz DEFAULT now()
);
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS medal_num int;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now();
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
-- if an id column pre-exists without a default, give it one so inserts succeed
DO $idfix$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='medals' AND column_name='id') THEN
    BEGIN ALTER TABLE public.medals ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $idfix$;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medals_select_own ON public.medals;
CREATE POLICY medals_select_own ON public.medals FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());
CREATE UNIQUE INDEX IF NOT EXISTS medals_user_num_uniq ON public.medals(user_id, medal_num);

-- 2) missing columns the pages read ------------------------------------------
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS cert_num int;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_earned int DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_num_uniq
  ON public.certificates(user_id, cert_num) WHERE cert_num IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trophies_user_num_uniq
  ON public.trophies(user_id, trophy_num) WHERE trophy_num IS NOT NULL;

-- 3) migrate any medals previously stored on trophies.medal_num --------------
INSERT INTO public.medals (user_id, medal_num, earned_at)
  SELECT user_id, medal_num, COALESCE(earned_at, now())
  FROM public.trophies WHERE medal_num IS NOT NULL
  ON CONFLICT (user_id, medal_num) DO NOTHING;
DELETE FROM public.trophies WHERE medal_num IS NOT NULL AND trophy_num IS NULL;
-- backfill cert_num from any milestone text that ends in a number
UPDATE public.certificates SET cert_num = NULLIF(regexp_replace(COALESCE(milestone,''),'\D','','g'),'')::int
  WHERE cert_num IS NULL AND milestone ~ '\d';

-- 4) the award model: how many of a track's 12 milestones an axis has lit ----
CREATE OR REPLACE FUNCTION public.milestones_for_axis(v numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, LEAST(12, floor((COALESCE(v,1) - 1) / 8.0 * 12)::int));
$$;

-- 5) complete_task -- now lights the 12 curated milestones per track ---------
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
          SELECT uid, COALESCE(p_title,'Sovereign Certificate '||k), 'Knowledge Milestone '||k, k
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

-- 6) order_stats -- medals now come from the medals table --------------------
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.medals),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el,cnt) FROM (
                       SELECT initcap(element) el, count(*) cnt FROM public.profiles
                       WHERE element IS NOT NULL AND btrim(element)<>'' GROUP BY initcap(element)) e),'{}'::jsonb)
  ) INTO r; RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.milestones_for_axis(numeric) TO authenticated, anon;

COMMIT;
