-- ============================================================================
-- Ω SYD OMEGA 91717 — ENTERPRISE LAYER
-- Fortune 500 licensing, API key management, audit trails, SLA tracking
-- Inspired by: Salesforce enterprise tiers, Stripe API keys, SAP audit
-- ============================================================================

-- ── ENTERPRISE ACCOUNTS (Fortune 500 / Government licensing) ─────────────
CREATE TABLE IF NOT EXISTS public.enterprise_accounts(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name        text        NOT NULL,
  org_type        text        NOT NULL DEFAULT 'corporate',
  contact_email   text        NOT NULL,
  contact_name    text,
  country         text,
  license_type    text        NOT NULL DEFAULT 'professional',
  license_seats   int         NOT NULL DEFAULT 10,
  license_start   date        NOT NULL DEFAULT CURRENT_DATE,
  license_end     date,
  monthly_value   numeric(14,4),
  currency        text        DEFAULT 'USD',
  status          text        NOT NULL DEFAULT 'pending',
  sla_tier        text        NOT NULL DEFAULT 'standard',
  dedicated_agent boolean     DEFAULT false,
  white_label     boolean     DEFAULT false,
  api_access      boolean     DEFAULT false,
  custom_domain   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_type_ck CHECK(org_type IN('corporate','government','ngo','education','startup','individual')),
  CONSTRAINT license_type_ck CHECK(license_type IN('starter','professional','enterprise','government','sovereign')),
  CONSTRAINT status_ck CHECK(status IN('pending','active','suspended','expired','cancelled')),
  CONSTRAINT sla_tier_ck CHECK(sla_tier IN('standard','premium','elite','sovereign'))
);
ALTER TABLE public.enterprise_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages enterprise" ON public.enterprise_accounts;
CREATE POLICY "owner manages enterprise" ON public.enterprise_accounts FOR ALL USING(public.is_platform_owner());

-- ── ENTERPRISE API KEYS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enterprise_id   uuid        REFERENCES public.enterprise_accounts(id),
  key_name        text        NOT NULL,
  key_hash        text        NOT NULL UNIQUE,  /* SHA-256 of actual key — never store plaintext */
  key_prefix      text        NOT NULL,          /* First 8 chars shown in UI: sk_live_XXXX */
  key_type        text        NOT NULL DEFAULT 'read',
  scopes          text[]      DEFAULT '{}',
  rate_limit_rpm  int         DEFAULT 60,
  last_used_at    timestamptz,
  expires_at      timestamptz,
  is_active       boolean     DEFAULT true,
  requests_total  bigint      DEFAULT 0,
  requests_today  bigint      DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT key_type_ck CHECK(key_type IN('read','write','admin','webhook'))
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own keys" ON public.api_keys;
CREATE POLICY "member sees own keys" ON public.api_keys FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "owner sees all keys" ON public.api_keys;
CREATE POLICY "owner sees all keys" ON public.api_keys FOR ALL USING(public.is_platform_owner());

-- ── ENTERPRISE AUDIT LOG ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enterprise_audit(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id   uuid        REFERENCES public.enterprise_accounts(id),
  user_id         uuid        REFERENCES public.profiles(id),
  action          text        NOT NULL,
  resource        text,
  resource_id     text,
  ip_hash         text,
  user_agent      text,
  outcome         text        DEFAULT 'success',
  metadata        jsonb       DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outcome_ck CHECK(outcome IN('success','failure','blocked','error'))
);
CREATE INDEX IF NOT EXISTS idx_ent_audit_time ON public.enterprise_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ent_audit_user ON public.enterprise_audit(user_id, created_at DESC);
ALTER TABLE public.enterprise_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner sees all audit" ON public.enterprise_audit;
CREATE POLICY "owner sees all audit" ON public.enterprise_audit FOR SELECT USING(public.is_platform_owner());

-- ── SLA METRICS TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sla_metrics(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id   uuid        REFERENCES public.enterprise_accounts(id),
  metric_period   date        NOT NULL DEFAULT CURRENT_DATE,
  uptime_pct      numeric(6,4),
  response_p95_ms int,
  response_p99_ms int,
  incidents_count int         DEFAULT 0,
  sla_target_pct  numeric(6,4) DEFAULT 99.9,
  sla_met         boolean,
  credit_issued   numeric(10,4) DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages sla" ON public.sla_metrics;
CREATE POLICY "owner manages sla" ON public.sla_metrics FOR ALL USING(public.is_platform_owner());

-- ── REVENUE INTELLIGENCE VIEW ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.revenue_intelligence AS
SELECT
  DATE_TRUNC('month', ea.created_at) AS month,
  COUNT(*)                            AS new_accounts,
  COUNT(*) FILTER(WHERE ea.status='active') AS active_accounts,
  SUM(ea.monthly_value)               AS total_mrr,
  AVG(ea.monthly_value)               AS avg_deal_size,
  COUNT(*) FILTER(WHERE ea.license_type='government') AS gov_accounts,
  COUNT(*) FILTER(WHERE ea.license_type='enterprise') AS ent_accounts,
  SUM(ea.license_seats)               AS total_seats
FROM public.enterprise_accounts ea
GROUP BY 1 ORDER BY 1 DESC;

-- ── GET ENTERPRISE SUMMARY RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_enterprise_summary()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE res jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','owner_only');
  END IF;
  SELECT jsonb_build_object(
    'ok',true,
    'total_accounts',COUNT(*),
    'active_accounts',COUNT(*) FILTER(WHERE status='active'),
    'total_mrr',COALESCE(SUM(monthly_value),0),
    'total_seats',COALESCE(SUM(license_seats),0),
    'by_type',jsonb_object_agg(license_type,count_by_type)
  ) INTO res
  FROM (
    SELECT status, license_type, monthly_value, license_seats,
           COUNT(*) OVER(PARTITION BY license_type) AS count_by_type
    FROM public.enterprise_accounts
  ) t;
  RETURN COALESCE(res, jsonb_build_object('ok',true,'total_accounts',0,'total_mrr',0));
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_enterprise_summary() TO authenticated;
