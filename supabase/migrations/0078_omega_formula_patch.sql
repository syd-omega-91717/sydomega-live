-- ============================================================================
-- SYD OMEGA 91717 — CANONICAL AUTHORITY FORMULA PATCH
-- Fixes get_all_members(), order_stats(), and public_leaderboard() which
-- were computing authority as sqrt(a²+b²+c²) (Euclidean, apex=15.588).
-- Canonical formula: AUTH = sqrt(A³+B³+C³) × φ/e, apex=27.8367
-- φ=1.6180339887, e=2.7182818285
-- Safe to run multiple times (CREATE OR REPLACE).
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'Applying canonical authority formula patch...'; END $$;

-- ── SHARED HELPER: compute_authority(a, b, c, is_owner) ───────────────────
-- Centralise the formula so future changes only need one edit.
CREATE OR REPLACE FUNCTION public.compute_authority(
  p_a numeric DEFAULT 0.001,
  p_b numeric DEFAULT 0.001,
  p_c numeric DEFAULT 0.001,
  p_is_owner boolean DEFAULT false
) RETURNS numeric LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE
    WHEN COALESCE(p_is_owner, false) THEN 27.8367
    ELSE round(
      sqrt(
        power(GREATEST(COALESCE(p_a,0.001),0.001),3) +
        power(GREATEST(COALESCE(p_b,0.001),0.001),3) +
        power(GREATEST(COALESCE(p_c,0.001),0.001),3)
      ) * 1.6180339887 / 2.7182818285,
      4
    )
  END;
$$;
GRANT EXECUTE ON FUNCTION public.compute_authority(numeric,numeric,numeric,boolean) TO authenticated, anon;

-- ── get_all_members() — owner panel roster ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(row ORDER BY ord),'[]'::jsonb) INTO result FROM (
    SELECT
      CASE WHEN COALESCE(p.access_approved,false)=false AND COALESCE(p.is_rejected,false)=false THEN 0
           WHEN COALESCE(p.is_trial,false) THEN 1 ELSE 2 END AS ord,
      jsonb_build_object(
        'id',                p.id,
        'email',             u.email,
        'display_name',      p.display_name,
        'sign',              p.sign,
        'element',           p.element,
        'axis_a',            GREATEST(COALESCE(p.axis_a,0.001),0.001),
        'axis_b',            GREATEST(COALESCE(p.axis_b,0.001),0.001),
        'axis_c',            GREATEST(COALESCE(p.axis_c,0.001),0.001),
        'authority',         public.compute_authority(p.axis_a,p.axis_b,p.axis_c,p.is_owner),
        'is_owner',          COALESCE(p.is_owner,false),
        'access_approved',   COALESCE(p.access_approved,false),
        'is_trial',          COALESCE(p.is_trial,false),
        'is_rejected',       COALESCE(p.is_rejected,false),
        'trial_expires_at',  p.trial_expires_at,
        'membership_tier',   p.membership_tier,
        'material_tier',     p.material_tier,
        'certificates_earned', COALESCE(p.certificates_earned,0),
        'created_at',        p.created_at,
        'subscription_tier', p.subscription_tier
      ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) q;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_members() TO authenticated, anon;

-- ── order_stats() — Hall of Fame aggregate statistics ─────────────────────
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
    'avg_authority',(SELECT COALESCE(round(avg(
                       public.compute_authority(axis_a,axis_b,axis_c,is_owner)
                     )::numeric,4),0) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'elements',     COALESCE((SELECT jsonb_object_agg(el,cnt) FROM (
                       SELECT initcap(element) el, count(*) cnt FROM public.profiles
                       WHERE element IS NOT NULL AND btrim(element)<>'' GROUP BY initcap(element)) e),'{}'::jsonb)
  ) INTO r; RETURN r;
END;
$$;
GRANT EXECUTE ON FUNCTION public.order_stats() TO authenticated, anon;

-- ── public_leaderboard() — privacy-safe ranked roster ─────────────────────
CREATE OR REPLACE FUNCTION public.public_leaderboard(p_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH ranked AS (
    SELECT
      COALESCE(NULLIF(btrim(display_name),''), 'Initiate-' || substr(id::text,1,4)) AS nm,
      sign, element,
      round(GREATEST(COALESCE(axis_a,0.001),0.001),3) AS a,
      round(GREATEST(COALESCE(axis_b,0.001),0.001),3) AS b,
      round(GREATEST(COALESCE(axis_c,0.001),0.001),3) AS c,
      public.compute_authority(axis_a,axis_b,axis_c,is_owner) AS auth_v,
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
    'rank',         rnk,
    'name',         nm,
    'sign',         sign,
    'element',      element,
    'axis_a',       a,
    'axis_b',       b,
    'axis_c',       c,
    'authority',    auth_v,
    'certificates', cert,
    'trophies',     tro,
    'medals',       med,
    'is_owner',     is_owner
  ) ORDER BY rnk), '[]'::jsonb)
  FROM numbered;
$$;
GRANT EXECUTE ON FUNCTION public.public_leaderboard(int) TO authenticated, anon;

DO $$ BEGIN RAISE NOTICE 'Formula patch complete. All authority values now use AUTH=sqrt(A³+B³+C³)×φ/e, apex=27.8367'; END $$;
