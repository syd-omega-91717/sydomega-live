-- ============================================================================
-- Ω SYD OMEGA 91717 — ENTERPRISE SCHEMA V2
-- Enterprise architecture upgrade integrating research from:
-- Google (data integrity patterns), Meta (social graph), SpaceX (reliability),
-- TikTok (recommendation signals), Wikipedia (knowledge graph),
-- Stripe (event audit trail), Discord (realtime presence)
-- ============================================================================

-- ── 1. CONTENT SECURITY POLICY meta-headers (via Supabase Edge Function) ──
-- NOTE: CSP is applied at the edge function level, not SQL.
-- Store CSP nonces and policy versions here for audit:

CREATE TABLE IF NOT EXISTS public.security_policies(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version     text NOT NULL,
  policy_type text NOT NULL DEFAULT 'CSP',
  policy_body text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES public.profiles(id)
);

-- ── 2. INTEREST GRAPH (TikTok-inspired discovery engine) ──────────────────
-- Maps each member's engagement signals to content/track affinities.
-- Powers recommendation engine: show content aligned with proven interests.
CREATE TABLE IF NOT EXISTS public.interest_signals(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal_type text NOT NULL, -- 'watch','complete','share','search','hover','repeat'
  content_id  text NOT NULL, -- page/game/exam/article identifier
  content_type text NOT NULL DEFAULT 'page', -- 'page','game','exam','article','track'
  track_id    int,           -- which of the 12 tracks
  axis_type   char(1),       -- A/B/C axis this signal strengthens
  weight      numeric(5,4)   NOT NULL DEFAULT 1.0,
  session_id  text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signal_type_valid CHECK(signal_type IN('watch','complete','share','search','hover','repeat','skip','bookmark'))
);
CREATE INDEX IF NOT EXISTS idx_interest_user_type ON public.interest_signals(user_id,content_type,recorded_at DESC);
ALTER TABLE public.interest_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own signals" ON public.interest_signals;
CREATE POLICY "member sees own signals" ON public.interest_signals FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "member inserts own signals" ON public.interest_signals;
CREATE POLICY "member inserts own signals" ON public.interest_signals FOR INSERT WITH CHECK(user_id=auth.uid());

-- ── 3. PRESENCE & SESSION TRACKING (Discord-inspired) ────────────────────
-- Real-time presence: who is online, on which page, since when.
CREATE TABLE IF NOT EXISTS public.member_presence(
  user_id     uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_online   boolean NOT NULL DEFAULT false,
  current_page text,
  session_started_at timestamptz,
  last_seen   timestamptz NOT NULL DEFAULT now(),
  client_info jsonb DEFAULT '{}'
);
ALTER TABLE public.member_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members see presence" ON public.member_presence;
CREATE POLICY "members see presence" ON public.member_presence FOR SELECT USING(true);
DROP POLICY IF EXISTS "member updates own presence" ON public.member_presence;
CREATE POLICY "member updates own presence" ON public.member_presence
  FOR ALL USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

-- ── 4. EVENT SOURCING LOG (Stripe-inspired immutable audit trail) ─────────
-- Every state change is an immutable event. Source of truth for authority,
-- progression, and access decisions.
CREATE TABLE IF NOT EXISTS public.sovereign_events(
  id          bigserial PRIMARY KEY,
  event_id    uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type  text NOT NULL,  -- 'task.complete','gate.unlock','trial.start','access.grant'
  event_data  jsonb NOT NULL DEFAULT '{}',
  axis_delta  jsonb,          -- {"a":0.001,"b":0.000,"c":0.000}
  auth_before numeric(10,4),
  auth_after  numeric(10,4),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text UNIQUE -- prevents duplicate event recording
);
CREATE INDEX IF NOT EXISTS idx_sov_events_user ON public.sovereign_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sov_events_type ON public.sovereign_events(event_type, occurred_at DESC);
ALTER TABLE public.sovereign_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own events" ON public.sovereign_events;
CREATE POLICY "member sees own events" ON public.sovereign_events FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "owner sees all events" ON public.sovereign_events;
CREATE POLICY "owner sees all events" ON public.sovereign_events FOR SELECT USING(public.is_platform_owner());

-- ── 5. RECOMMENDATION ENGINE (TikTok-inspired interest graph output) ──────
-- Stores pre-computed content affinities per member, updated by background job.
CREATE TABLE IF NOT EXISTS public.content_recommendations(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id  text NOT NULL,
  content_type text NOT NULL,
  affinity_score numeric(6,4) NOT NULL DEFAULT 0.0,
  reason      text,  -- 'high_axis_a','element_match','track_progress','peer_interest'
  served      boolean DEFAULT false,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz DEFAULT now() + INTERVAL '24 hours',
  UNIQUE(user_id, content_id)
);
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own recs" ON public.content_recommendations;
CREATE POLICY "member sees own recs" ON public.content_recommendations FOR SELECT USING(user_id=auth.uid());

-- ── 6. KNOWLEDGE GRAPH (Wikipedia-inspired concept linking) ───────────────
-- Links platform concepts, tracks, elements, and canon entities.
-- Enables "related content" features and semantic navigation.
CREATE TABLE IF NOT EXISTS public.knowledge_nodes(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type   text NOT NULL, -- 'track','element','olympian','concept','gate'
  node_key    text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text,
  properties  jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.knowledge_edges(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node   uuid NOT NULL REFERENCES public.knowledge_nodes(id),
  to_node     uuid NOT NULL REFERENCES public.knowledge_nodes(id),
  edge_type   text NOT NULL, -- 'requires','enables','related_to','leads_to','opposes'
  weight      numeric(4,3) DEFAULT 1.0,
  UNIQUE(from_node, to_node, edge_type)
);

-- ── 7. LEADERBOARD SNAPSHOTS (Google PageRank-inspired authority ranking) ─
-- Daily snapshots prevent gaming — rank is computed, not gamed in real time.
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  authority   numeric(10,4) NOT NULL,
  rank_global int,
  rank_track  int,
  rank_element int,
  axis_a      numeric(8,4) NOT NULL DEFAULT 0.001,
  axis_b      numeric(8,4) NOT NULL DEFAULT 0.001,
  axis_c      numeric(8,4) NOT NULL DEFAULT 0.001,
  track_id    int,
  element     text,
  UNIQUE(user_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_lb_date_rank ON public.leaderboard_snapshots(snapshot_date, rank_global);
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all members see leaderboard" ON public.leaderboard_snapshots;
CREATE POLICY "all members see leaderboard" ON public.leaderboard_snapshots FOR SELECT USING(true);

-- ── 8. RATE LIMITING TABLE (Cloudflare-inspired token bucket) ─────────────
CREATE TABLE IF NOT EXISTS public.rate_limits(
  key         text PRIMARY KEY,  -- 'user:{uid}:task' or 'ip:{ip}:auth'
  tokens      int NOT NULL DEFAULT 10,
  last_refill timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 9. CIRCUIT BREAKER STATE (SpaceX reliability pattern) ────────────────
-- If a service fails repeatedly, circuit opens and fails fast until recovery.
CREATE TABLE IF NOT EXISTS public.circuit_breakers(
  service_name text PRIMARY KEY,
  state       text NOT NULL DEFAULT 'closed' CHECK(state IN('closed','open','half-open')),
  failure_count int NOT NULL DEFAULT 0,
  last_failure timestamptz,
  opened_at   timestamptz,
  recovery_at timestamptz,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 10. CONTENT VERSIONS (Git-inspired immutable versioning) ──────────────
-- Every piece of content that changes gets a version. Rollback is always possible.
CREATE TABLE IF NOT EXISTS public.content_versions(
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL,
  version     int NOT NULL DEFAULT 1,
  content     jsonb NOT NULL,
  author_id   uuid REFERENCES public.profiles(id),
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  is_current  boolean DEFAULT true,
  UNIQUE(content_key, version)
);

-- ── 11. AUTHORITY RPC — upgrades to include event sourcing + interest signals ──
CREATE OR REPLACE FUNCTION public.record_sovereign_event(
  p_event_type  text,
  p_event_data  jsonb DEFAULT '{}',
  p_axis_delta  jsonb DEFAULT '{"a":0,"b":0,"c":0}',
  p_idempotency text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _uid        uuid := auth.uid();
  _pr         record;
  _auth_before numeric(10,4);
  _auth_after  numeric(10,4);
  _PHI        constant numeric := 1.6180339887;
  _EU         constant numeric := 2.7182818285;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  /* Idempotency: don't double-record */
  IF p_idempotency IS NOT NULL THEN
    IF EXISTS(SELECT 1 FROM public.sovereign_events WHERE idempotency_key=p_idempotency) THEN
      RETURN jsonb_build_object('ok',true,'status','duplicate','idempotent',true);
    END IF;
  END IF;
  SELECT axis_a,axis_b,axis_c INTO _pr FROM public.profiles WHERE id=_uid;
  _auth_before := SQRT(POWER(_pr.axis_a,3)+POWER(_pr.axis_b,3)+POWER(_pr.axis_c,3))*_PHI/_EU;
  /* Apply axis deltas */
  UPDATE public.profiles SET
    axis_a = LEAST(9.000, GREATEST(0.001, axis_a + COALESCE((p_axis_delta->>'a')::numeric,0))),
    axis_b = LEAST(9.000, GREATEST(0.001, axis_b + COALESCE((p_axis_delta->>'b')::numeric,0))),
    axis_c = LEAST(9.000, GREATEST(0.001, axis_c + COALESCE((p_axis_delta->>'c')::numeric,0)))
  WHERE id=_uid;
  SELECT axis_a,axis_b,axis_c INTO _pr FROM public.profiles WHERE id=_uid;
  _auth_after := SQRT(POWER(_pr.axis_a,3)+POWER(_pr.axis_b,3)+POWER(_pr.axis_c,3))*_PHI/_EU;
  /* Insert event */
  INSERT INTO public.sovereign_events(user_id,event_type,event_data,axis_delta,auth_before,auth_after,idempotency_key)
  VALUES(_uid,p_event_type,p_event_data,p_axis_delta,_auth_before,_auth_after,p_idempotency);
  RETURN jsonb_build_object('ok',true,'auth_before',_auth_before,'auth_after',_auth_after,'delta',_auth_after-_auth_before);
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_sovereign_event(text,jsonb,jsonb,text) TO authenticated;

-- ── 12. COMPUTE LEADERBOARD SNAPSHOT (daily cron job) ────────────────────
CREATE OR REPLACE FUNCTION public.compute_leaderboard_snapshot()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _PHI constant numeric := 1.6180339887;
  _EU  constant numeric := 2.7182818285;
BEGIN
  INSERT INTO public.leaderboard_snapshots(user_id,snapshot_date,authority,axis_a,axis_b,axis_c)
  SELECT
    id,
    CURRENT_DATE,
    SQRT(POWER(axis_a,3)+POWER(axis_b,3)+POWER(axis_c,3))*_PHI/_EU,
    axis_a, axis_b, axis_c
  FROM public.profiles
  WHERE access_approved=true OR is_owner=true
  ON CONFLICT(user_id,snapshot_date) DO UPDATE SET
    authority=EXCLUDED.authority,
    axis_a=EXCLUDED.axis_a,
    axis_b=EXCLUDED.axis_b,
    axis_c=EXCLUDED.axis_c;
  /* Compute global ranks */
  WITH ranked AS(
    SELECT user_id, ROW_NUMBER() OVER(ORDER BY authority DESC) as rk
    FROM public.leaderboard_snapshots WHERE snapshot_date=CURRENT_DATE
  )
  UPDATE public.leaderboard_snapshots ls SET rank_global=r.rk
  FROM ranked r WHERE ls.user_id=r.user_id AND ls.snapshot_date=CURRENT_DATE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.compute_leaderboard_snapshot() TO service_role;
