-- ============================================================================
-- Ω SYD OMEGA 91717 — THREAT INTELLIGENCE & SOC LAYER
-- Security events, threat log, SIEM tables, behavioral anomaly tracking
-- Inspired by: Palantir Gotham, Cloudflare Zero Trust, OWASP ASVS
-- ============================================================================

-- ── THREAT EVENTS (SIEM) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.threat_events(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES public.profiles(id),
  threat_type     text        NOT NULL,
  threat_level    int         NOT NULL DEFAULT 1 CHECK(threat_level BETWEEN 0 AND 3),
  detail          jsonb       DEFAULT '{}',
  page            text,
  user_agent      text,
  ip_hash         text,
  session_id      text,
  resolved        boolean     DEFAULT false,
  resolved_at     timestamptz,
  resolved_by     uuid        REFERENCES public.profiles(id),
  false_positive  boolean     DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT threat_type_ck CHECK(threat_type IN(
    'rapid_clicks','ua_change','console_clear','rate_limit',
    'iframe_embed','inline_script_injected','auth_failure',
    'suspicious_rpc','invalid_apex','session_anomaly','brute_force',
    'data_exfiltration_attempt','privilege_escalation'
  ))
);
CREATE INDEX IF NOT EXISTS idx_threat_user    ON public.threat_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_level   ON public.threat_events(threat_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_unres   ON public.threat_events(resolved, created_at DESC) WHERE NOT resolved;
ALTER TABLE public.threat_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insert threat events" ON public.threat_events;
CREATE POLICY "insert threat events" ON public.threat_events FOR INSERT TO authenticated WITH CHECK(true);
DROP POLICY IF EXISTS "owner reads threats" ON public.threat_events;
CREATE POLICY "owner reads threats" ON public.threat_events FOR SELECT USING(public.is_platform_owner());
DROP POLICY IF EXISTS "owner manages threats" ON public.threat_events;
CREATE POLICY "owner manages threats" ON public.threat_events FOR ALL USING(public.is_platform_owner());

-- ── PLATFORM EVENTS LOG (OmegaOS telemetry) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_events(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES public.profiles(id),
  event_type      text        NOT NULL,
  page            text,
  session_id      text,
  duration_s      int,
  metrics         jsonb       DEFAULT '{}',
  os_version      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pevt_user ON public.platform_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pevt_type ON public.platform_events(event_type, created_at DESC);
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member inserts own events" ON public.platform_events;
CREATE POLICY "member inserts own events" ON public.platform_events FOR INSERT TO authenticated WITH CHECK(true);
DROP POLICY IF EXISTS "owner reads all events" ON public.platform_events;
CREATE POLICY "owner reads all events" ON public.platform_events FOR SELECT USING(public.is_platform_owner());

-- ── SOC ALERTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.soc_alerts(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        text        NOT NULL UNIQUE DEFAULT 'ALT-'||extract(epoch from now())::int,
  severity        text        NOT NULL DEFAULT 'medium',
  title           text        NOT NULL,
  description     text,
  affected_user   uuid        REFERENCES public.profiles(id),
  threat_event_id uuid        REFERENCES public.threat_events(id),
  status          text        NOT NULL DEFAULT 'open',
  assigned_to     text,
  resolved_at     timestamptz,
  playbook        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sev_ck CHECK(severity IN('info','low','medium','high','critical')),
  CONSTRAINT status_ck CHECK(status IN('open','investigating','contained','resolved','false_positive'))
);
ALTER TABLE public.soc_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages soc" ON public.soc_alerts;
CREATE POLICY "owner manages soc" ON public.soc_alerts FOR ALL USING(public.is_platform_owner());

-- ── AUTO-ESCALATE HIGH THREAT LEVEL TO SOC ALERT ─────────────────────────
CREATE OR REPLACE FUNCTION public.auto_soc_alert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.threat_level >= 2 THEN
    INSERT INTO public.soc_alerts(title,description,severity,affected_user,threat_event_id)
    VALUES(
      'THREAT LEVEL '||NEW.threat_level||': '||UPPER(REPLACE(NEW.threat_type,'_',' ')),
      'Auto-escalated from threat_events. Page: '||COALESCE(NEW.page,'?')||'. Detail: '||COALESCE(NEW.detail::text,'{}'),
      CASE NEW.threat_level WHEN 3 THEN 'critical' WHEN 2 THEN 'high' ELSE 'medium' END,
      NEW.user_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trig_auto_soc ON public.threat_events;
CREATE TRIGGER trig_auto_soc AFTER INSERT ON public.threat_events
  FOR EACH ROW EXECUTE FUNCTION public.auto_soc_alert();

-- ── THREAT INTELLIGENCE SUMMARY RPC ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_threat_summary(p_days int DEFAULT 7)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE res jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  SELECT jsonb_build_object(
    'ok',true,
    'period_days',p_days,
    'total_events',COUNT(*),
    'critical_events',COUNT(*) FILTER(WHERE threat_level=3),
    'high_events',COUNT(*) FILTER(WHERE threat_level=2),
    'unresolved',COUNT(*) FILTER(WHERE NOT resolved),
    'top_threat_types',jsonb_agg(DISTINCT threat_type ORDER BY threat_type) FILTER(WHERE threat_level>=2)
  ) INTO res
  FROM public.threat_events
  WHERE created_at > now()-make_interval(days=>p_days);
  RETURN COALESCE(res, jsonb_build_object('ok',true,'total_events',0));
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_threat_summary(int) TO authenticated;
