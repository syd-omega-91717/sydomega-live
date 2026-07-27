-- ============================================================================
-- Ω SYD OMEGA 91717 — GOVERNANCE, ETHICS & RISK LAYER
-- Policy registry, ethics board, risk register, audit charter
-- Inspired by: ISO 27001, TOGAF, McKinsey governance frameworks
-- ============================================================================

-- ── GOVERNANCE POLICIES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.governance_policies(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id       text        NOT NULL UNIQUE, -- 'POL-001', 'POL-002'
  category        text        NOT NULL,
  title           text        NOT NULL,
  description     text,
  status          text        NOT NULL DEFAULT 'draft',
  version         text        NOT NULL DEFAULT '1.0',
  owner_role      text        DEFAULT 'sovereign_founder',
  review_cycle    text        DEFAULT 'annual',
  last_reviewed   date,
  next_review     date,
  tags            text[]      DEFAULT '{}',
  content         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_ck CHECK(status IN('draft','active','deprecated','superseded')),
  CONSTRAINT category_ck CHECK(category IN('security','privacy','data','ai','ethics','finance','operations','legal','platform'))
);
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read active policies" ON public.governance_policies;
CREATE POLICY "members read active policies" ON public.governance_policies FOR SELECT USING(status='active');
DROP POLICY IF EXISTS "owner manages policies" ON public.governance_policies;
CREATE POLICY "owner manages policies" ON public.governance_policies FOR ALL USING(public.is_platform_owner());

-- Seed canonical policies
INSERT INTO public.governance_policies(policy_id,category,title,description,status,version) VALUES
  ('POL-001','platform','Sovereign Lattice Immutability','The 104,976-node canonical lattice structure is immutable. No modifications to track count, phase count, or axis depth without owner directive.','active','1.0'),
  ('POL-002','security','Zero Trust Access Control','Every request to platform resources must be authenticated, authorized, and verified. No implicit trust.','active','1.0'),
  ('POL-003','ai','AI Canon Compliance','All AI systems must reference omega-canon.json as the ground truth. Fabricated data is forbidden. Auth formula must use cubic exponents.','active','1.0'),
  ('POL-004','privacy','GDPR Article 17 Erasure','Right to erasure must complete within 30 days. Cascades through all user tables. Owner account cannot be erased.','active','1.0'),
  ('POL-005','finance','Token Economy Legal Gating','All token economy, KYC/AML, and blockchain features remain dormant until licensed legal counsel confirms compliance.','active','1.0'),
  ('POL-006','ethics','No Fabricated Data','No hardcoded balances, fake financial figures, placeholder token values, or invented statistics in any user-facing context.','active','1.0'),
  ('POL-007','data','Credential Security','All API keys, secrets, and database credentials must be rotated before deployment. No secrets in source code or chat history.','active','1.0'),
  ('POL-008','platform','Authority Formula Permanence','AUTH=sqrt(A³+B³+C³)×φ/e is permanent and non-negotiable. The quadratic form sqrt(A²+B²+C²) is deprecated and must never appear.','active','1.0'),
  ('POL-009','ai','Sovereign AI Alignment','All AI agents must remain within their designated domains. No agent may claim capabilities beyond the sovereign platform.','active','1.0'),
  ('POL-010','platform','Static Architecture Primacy','The live sydomega.com deployment uses static HTML/JS only. No React build step, no monorepo in production. Vercel static hosting.','active','1.0')
ON CONFLICT(policy_id) DO NOTHING;

-- ── RISK REGISTER ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.risk_register(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id         text        NOT NULL UNIQUE,
  category        text        NOT NULL,
  title           text        NOT NULL,
  description     text,
  likelihood      int         NOT NULL DEFAULT 2 CHECK(likelihood BETWEEN 1 AND 5),
  impact          int         NOT NULL DEFAULT 2 CHECK(impact BETWEEN 1 AND 5),
  risk_score      int         GENERATED ALWAYS AS (likelihood*impact) STORED,
  status          text        NOT NULL DEFAULT 'open',
  mitigation      text,
  owner_role      text,
  residual_risk   int,
  iso27001_control text,
  owasp_ref       text,
  reviewed_at     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT category_ck CHECK(category IN('security','legal','technical','financial','operational','reputational','compliance')),
  CONSTRAINT status_ck CHECK(status IN('open','mitigated','accepted','closed','transferred'))
);
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner manages risks" ON public.risk_register;
CREATE POLICY "owner manages risks" ON public.risk_register FOR ALL USING(public.is_platform_owner());

INSERT INTO public.risk_register(risk_id,category,title,description,likelihood,impact,status,mitigation,iso27001_control) VALUES
  ('RSK-001','security','SQL Injection via RPC parameters',          'Malicious SQL in RPC inputs could expose or corrupt data',          2,5,'mitigated','All RPCs use parameterised queries and RLS. No dynamic SQL.','A.8.28'),
  ('RSK-002','legal','Token economy securities misclassification',   'ΩSYD tokens may be classified as securities without legal review',   3,5,'open','Token economy fully dormant. Licensed counsel required before activation.','A.5.19'),
  ('RSK-003','technical','Supabase single point of failure',         'Platform fully dependent on Supabase availability',                  2,4,'mitigated','Circuit breakers in omega-sovereign-os.js. Graceful degradation.','A.8.6'),
  ('RSK-004','security','Exposed credentials in repository',         'API keys leaked in source code or chat logs',                        2,5,'mitigated','Rotation required before deployment. All keys treated as compromised if seen in chat.','A.8.10'),
  ('RSK-005','compliance','GDPR erasure not cascading correctly',    'Data remnants after erasure could violate Article 17',              2,4,'mitigated','request_account_erasure() cascades through all tables. Tested.','A.5.34'),
  ('RSK-006','operational','Schema migration ordering errors',       'OUT-OF-ORDER migrations cause null constraint failures',            3,3,'mitigated','RUN_ORDER.md defines exact migration sequence.','A.8.32')
ON CONFLICT(risk_id) DO NOTHING;

-- ── ETHICS DECLARATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ethics_declarations(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id  text        NOT NULL UNIQUE,
  principle       text        NOT NULL,
  description     text        NOT NULL,
  applies_to      text[]      DEFAULT '{"all"}',
  status          text        NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ethics_declarations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all read ethics" ON public.ethics_declarations;
CREATE POLICY "all read ethics" ON public.ethics_declarations FOR SELECT TO anon,authenticated USING(true);

INSERT INTO public.ethics_declarations(declaration_id,principle,description) VALUES
  ('ETH-001','No Dark Patterns','Platform never uses deceptive UI patterns to mislead members into unintended actions.'),
  ('ETH-002','Transparent AI','All AI responses are grounded in verifiable platform data. No fabrication.'),
  ('ETH-003','Privacy by Design','Data minimisation by default. Collect only what is required for sovereign progression.'),
  ('ETH-004','No Surveillance','Member activity data is used only for their own progression. Never sold. Never profiled for ads.'),
  ('ETH-005','Sovereign Autonomy','Members always retain control of their data, progression, and platform interaction.'),
  ('ETH-006','Algorithmic Fairness','The Authority Formula treats all members identically. No hidden multipliers or preferential scoring.'),
  ('ETH-007','Informed Consent','Every data collection point has a clear consent record. Members can revoke at any time.'),
  ('ETH-008','Human Override','All AI decisions affecting member status (approvals, blocks) require human review by the Sovereign Founder.')
ON CONFLICT(declaration_id) DO NOTHING;

-- ── GOVERNANCE HEALTH RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_governance_health()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE
  open_risks   int;
  high_risks   int;
  active_pols  int;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  SELECT COUNT(*) INTO open_risks  FROM public.risk_register  WHERE status='open';
  SELECT COUNT(*) INTO high_risks  FROM public.risk_register  WHERE status='open' AND risk_score>=15;
  SELECT COUNT(*) INTO active_pols FROM public.governance_policies WHERE status='active';
  RETURN jsonb_build_object(
    'ok',true,
    'open_risks',open_risks,
    'critical_risks',high_risks,
    'active_policies',active_pols,
    'ethics_score',ROUND(100.0-LEAST(open_risks*5,50),1),
    'governance_maturity',CASE
      WHEN high_risks=0 THEN 'OPTIMISED'
      WHEN high_risks<=2 THEN 'MANAGED'
      WHEN high_risks<=5 THEN 'DEFINED'
      ELSE 'INITIAL' END
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_governance_health() TO authenticated;
