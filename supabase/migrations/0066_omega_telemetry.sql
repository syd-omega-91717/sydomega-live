-- ============================================================================
-- Ω SYD OMEGA 91717 — TELEMETRY & USER JOURNEY ANALYTICS
-- Tracks: page views, CTAs, tab switches, searches, errors, gate views
-- Powers: SRE observatory, conversion funnels, retention analysis
-- Inspired by: Mixpanel event model, Amplitude user journeys, GA4 protocol
-- ============================================================================

-- ── TELEMETRY EVENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telemetry_events(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type   text        NOT NULL,
  page         text,
  session_id   text,
  properties   jsonb       DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tel_user    ON public.telemetry_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tel_event   ON public.telemetry_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tel_session ON public.telemetry_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tel_page    ON public.telemetry_events(page, created_at DESC);
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member inserts own telemetry" ON public.telemetry_events;
CREATE POLICY "member inserts own telemetry" ON public.telemetry_events
  FOR INSERT TO authenticated WITH CHECK((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "owner reads all telemetry" ON public.telemetry_events;
CREATE POLICY "owner reads all telemetry" ON public.telemetry_events
  FOR SELECT USING(public.is_platform_owner());

-- ── USER JOURNEYS (aggregated sessions) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_journeys(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id   text        NOT NULL UNIQUE,
  entry_page   text,
  exit_page    text,
  pages_viewed int         DEFAULT 1,
  duration_s   int,
  actions_count int        DEFAULT 0,
  auth_at_start numeric(8,4),
  auth_at_end   numeric(8,4),
  element      text,
  sign         text,
  completed_task boolean   DEFAULT false,
  started_at   timestamptz NOT NULL DEFAULT now(),
  ended_at     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_jrn_user ON public.user_journeys(user_id, started_at DESC);
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own journey" ON public.user_journeys;
CREATE POLICY "member sees own journey" ON public.user_journeys
  FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "owner reads journeys" ON public.user_journeys;
CREATE POLICY "owner reads journeys" ON public.user_journeys
  FOR SELECT USING(public.is_platform_owner());
DROP POLICY IF EXISTS "member inserts journey" ON public.user_journeys;
CREATE POLICY "member inserts journey" ON public.user_journeys
  FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());

-- ── PLATFORM METRICS (Core Web Vitals + custom) ────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_metrics(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date  date        NOT NULL DEFAULT CURRENT_DATE,
  metric_name  text        NOT NULL,
  metric_value numeric(12,4),
  dimensions   jsonb       DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(metric_date, metric_name)
);
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member inserts metrics" ON public.platform_metrics;
CREATE POLICY "member inserts metrics" ON public.platform_metrics
  FOR INSERT TO authenticated WITH CHECK(
    metric_name IS NOT NULL
    AND length(btrim(metric_name)) BETWEEN 1 AND 128
    AND metric_date IS NOT NULL
    AND metric_date BETWEEN CURRENT_DATE - 1 AND CURRENT_DATE + 1
    AND metric_value IS NOT NULL);
DROP POLICY IF EXISTS "owner reads metrics" ON public.platform_metrics;
CREATE POLICY "owner reads metrics" ON public.platform_metrics
  FOR ALL USING(public.is_platform_owner());

-- ── CONVERSION FUNNELS VIEW ───────────────────────────────────────────────
CREATE OR REPLACE VIEW public.conversion_funnel AS
SELECT
  DATE_TRUNC('day', te.created_at)    AS day,
  COUNT(DISTINCT te.session_id)        AS total_sessions,
  COUNT(DISTINCT te.session_id) FILTER(WHERE te.event_type='page_view' AND te.page='dashboard') AS saw_dashboard,
  COUNT(DISTINCT te.session_id) FILTER(WHERE te.event_type='tab_switch') AS engaged_tabs,
  COUNT(DISTINCT te.session_id) FILTER(WHERE te.event_type='cta_click') AS clicked_cta,
  COUNT(DISTINCT te.user_id)           AS unique_users
FROM public.telemetry_events te
GROUP BY 1 ORDER BY 1 DESC;

-- ── TOP PAGES VIEW ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.top_pages AS
SELECT
  page,
  COUNT(*)                AS total_views,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) AS unique_users,
  MAX(created_at)         AS last_viewed
FROM public.telemetry_events
WHERE event_type='page_view' AND page IS NOT NULL
GROUP BY page ORDER BY total_views DESC;

-- ── ANALYTICS SUMMARY RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_analytics_summary(p_days int DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE res jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','owner_only');
  END IF;
  SELECT jsonb_build_object(
    'ok',true,
    'period_days',p_days,
    'total_events',COUNT(*),
    'unique_sessions',COUNT(DISTINCT session_id),
    'unique_users',COUNT(DISTINCT user_id),
    'page_views',COUNT(*) FILTER(WHERE event_type='page_view'),
    'cta_clicks',COUNT(*) FILTER(WHERE event_type='cta_click'),
    'searches',COUNT(*) FILTER(WHERE event_type='search_query'),
    'errors',COUNT(*) FILTER(WHERE event_type='error_encountered')
  ) INTO res
  FROM public.telemetry_events
  WHERE created_at > now()-make_interval(days=>p_days);
  RETURN COALESCE(res, jsonb_build_object('ok',true,'total_events',0));
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(int) TO authenticated;
