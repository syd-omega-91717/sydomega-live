-- ============================================================================
-- Ω SYD OMEGA 91717 — SRE SLO MONITORING & ERROR BUDGET (Google SRE model)
-- Research: Google SRE Workbook — Error Budget Policy
-- SLO: 99.9% availability → error budget = 1000 errors per 1M requests
-- Rule: if >20% of 4-week budget consumed → halt non-critical releases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.slo_metrics(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name  text        NOT NULL,
  surface      text        NOT NULL DEFAULT 'platform', -- 'auth','matrix','vault','payments'
  total_requests  bigint   NOT NULL DEFAULT 0,
  good_requests   bigint   NOT NULL DEFAULT 0,
  bad_requests    bigint   NOT NULL DEFAULT 0,
  p50_ms       int,
  p95_ms       int,
  p99_ms       int,
  slo_target   numeric(6,4) NOT NULL DEFAULT 0.999,  -- 99.9%
  window_start timestamptz NOT NULL,
  window_end   timestamptz NOT NULL DEFAULT now(),
  recorded_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_slo_surface ON public.slo_metrics(surface, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.error_budget_policy(
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  surface          text    NOT NULL UNIQUE,
  slo_target       numeric(6,4) NOT NULL DEFAULT 0.999,
  budget_4wk_pct   numeric(6,4), -- % of 4-week error budget consumed
  alert_threshold  numeric(6,4) DEFAULT 0.20, -- alert at 20% consumed
  halt_threshold   numeric(6,4) DEFAULT 0.50, -- halt releases at 50%
  status           text NOT NULL DEFAULT 'green',
  last_computed    timestamptz DEFAULT now(),
  CONSTRAINT status_ck CHECK(status IN('green','yellow','red','halted'))
);

-- Seed known surfaces
INSERT INTO public.error_budget_policy(surface,slo_target,status) VALUES
  ('auth_service',     0.999, 'green'),
  ('matrix_engine',    0.999, 'green'),
  ('vault_service',    0.995, 'green'),
  ('chatbot_service',  0.99,  'green'),
  ('payment_service',  0.9999,'green')
ON CONFLICT(surface) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.incidents(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  surface      text        NOT NULL,
  severity     text        NOT NULL DEFAULT 'P2',
  status       text        NOT NULL DEFAULT 'open',
  started_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  ttd_minutes  int,  -- time to detect
  ttr_minutes  int,  -- time to resolve
  impact       text,
  root_cause   text,
  action_items jsonb DEFAULT '[]',
  postmortem   text,
  author_id    uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT severity_ck CHECK(severity IN('P0','P1','P2','P3','P4')),
  CONSTRAINT status_ck CHECK(status IN('open','investigating','mitigated','resolved','postmortem'))
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages incidents" ON public.incidents;
CREATE POLICY "owner manages incidents" ON public.incidents FOR ALL USING(public.is_platform_owner());

-- Record a platform health metric
CREATE OR REPLACE FUNCTION public.record_health_metric(
  p_surface     text,
  p_good        bigint,
  p_total       bigint,
  p_p95_ms      int DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _slo    numeric(6,4);
  _actual numeric(8,6);
  _budget numeric(8,6);
BEGIN
  SELECT slo_target INTO _slo FROM public.error_budget_policy WHERE surface=p_surface;
  IF NOT FOUND THEN _slo:=0.999; END IF;
  _actual := p_good::numeric / NULLIF(p_total,0);
  _budget := 1.0 - _slo;
  INSERT INTO public.slo_metrics(metric_name,surface,total_requests,good_requests,bad_requests,p95_ms,slo_target,window_start)
  VALUES(p_surface||'_health',p_surface,p_total,p_good,p_total-p_good,p_p95_ms,_slo,now()-INTERVAL '5 minutes');
  /* Update error budget status */
  UPDATE public.error_budget_policy SET
    budget_4wk_pct = CASE WHEN _actual < _slo THEN LEAST(1.0,(1.0-_actual)/_budget) ELSE 0 END,
    status = CASE
      WHEN _actual IS NULL OR _actual>=_slo THEN 'green'
      WHEN (1.0-_actual)/_budget < 0.20    THEN 'green'
      WHEN (1.0-_actual)/_budget < 0.50    THEN 'yellow'
      WHEN (1.0-_actual)/_budget < 1.0     THEN 'red'
      ELSE 'halted' END,
    last_computed = now()
  WHERE surface=p_surface;
  RETURN jsonb_build_object('ok',true,'actual_slo',_actual,'slo_target',_slo,'status','recorded');
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_health_metric(text,bigint,bigint,int) TO service_role;
