-- ============================================================================
-- SYD OMEGA 91717 -- HALL OF FAME
-- A privacy-safe public ranking (no emails) of those who have crossed the
-- threshold, ordered by authority as they ascend the 729-matrix.
-- Also patches order_stats to return the element distribution the Hall charts.
-- Run AFTER OMEGA_EVOLUTION_RPC.sql. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- public_leaderboard(limit) -- ranked roster, SAFE for anon (no email/id leak)
--   name = member's chosen display_name, else an anonymous Initiate tag
--   authority computed from axes so even inactive members rank correctly
--   only members of the Order (approved) and the Sovereign appear
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_leaderboard(p_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH ranked AS (
    SELECT
      COALESCE(NULLIF(btrim(display_name),''), 'Initiate-' || substr(id::text,1,4)) AS nm,
      sign, element,
      round(COALESCE(axis_a,1),2) AS a,
      round(COALESCE(axis_b,1),2) AS b,
      round(COALESCE(axis_c,1),2) AS c,
      round(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2))::numeric,3) AS auth_v,
      COALESCE(certificates_earned,0) AS cert,
      COALESCE(trophies_earned,0)     AS tro,
      COALESCE(medals_earned,0)       AS med,
      COALESCE(is_owner,false)        AS is_owner,
      created_at
    FROM public.profiles
    WHERE COALESCE(access_approved,false) OR COALESCE(is_owner,false)
  ),
  numbered AS (
    SELECT *, row_number() OVER (ORDER BY auth_v DESC, created_at ASC NULLS LAST) AS rnk
    FROM ranked
    ORDER BY auth_v DESC, created_at ASC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit,50), 200))
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rank', rnk, 'name', nm, 'sign', sign, 'element', element,
    'axis_a', a, 'axis_b', b, 'axis_c', c, 'authority', auth_v,
    'certificates', cert, 'trophies', tro, 'medals', med, 'is_owner', is_owner
  ) ORDER BY rnk), '[]'::jsonb)
  FROM numbered;
$$;

-- ----------------------------------------------------------------------------
-- order_stats -- now also returns the element distribution (Title-cased to
-- match the Hall chart keys: Fire/Water/Wind/Metal/Sand). Same return type as
-- before (jsonb), so this is a clean replace.
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

GRANT EXECUTE ON FUNCTION public.public_leaderboard(int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()           TO authenticated, anon;

COMMIT;
