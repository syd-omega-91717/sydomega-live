-- ============================================================================
-- Ω SYD OMEGA 91717 — POLICY ENGINE v2 (ALL ERRORS FIXED)
-- Externalised business rules, compliance policies, AI guardrails
-- Fixes: effect='require'→'enforce', all ARRAY[] casts explicit
-- ============================================================================

-- ── POLICY RULES TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.policy_rules(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id    text        NOT NULL UNIQUE,
  policy_type  text        NOT NULL,
  effect       text        NOT NULL DEFAULT 'allow',
  description  text        NOT NULL,
  condition    jsonb       DEFAULT '{}',
  is_critical  boolean     DEFAULT false,
  standard     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pol_type_ck CHECK(policy_type IN('gate','approval','guardrail','compliance','business','rate')),
  CONSTRAINT effect_ck   CHECK(effect IN('allow','deny','require_confirm','require_owner','limit','enforce','block'))
);

-- Seed canonical policies (effect values match constraint exactly)
INSERT INTO public.policy_rules(policy_id,policy_type,effect,description,is_critical,standard) VALUES
  /* Critical business rules */
  ('biz:formula_cubic',  'business', 'enforce','AUTH formula must use cubic exponents: sqrt(A³+B³+C³)×φ/e',true,'SOVEREIGN_CANON'),
  ('biz:apex_constant',  'business', 'enforce','Authority apex is permanently 27.8367. Immutable.',          true,'SOVEREIGN_CANON'),
  ('biz:trial_duration', 'business', 'enforce','Trial period is exactly 557 seconds (9 min 17 sec)',        true,'SOVEREIGN_CANON'),
  ('biz:no_fake_data',   'business', 'deny',   'No fabricated balances, token values, or financial figures', true,'SOVEREIGN_CANON'),
  ('biz:static_prod',    'business', 'enforce','Live sydomega.com uses static HTML/JS only. No build step.', true,'ARCHITECTURE'),
  /* AI guardrails */
  ('ai:fabricate_data',  'guardrail','deny',   'AI must never fabricate platform data or statistics',        true,'AI_SAFETY'),
  ('ai:legal_advice',    'guardrail','deny',   'AI must not give legal, financial, or medical advice',       false,'COMPLIANCE'),
  ('ai:owner_impersonate','guardrail','deny',  'AI must never claim to be the platform owner',               true,'AI_SAFETY'),
  ('ai:canon_override',  'guardrail','deny',   'AI must not override canonical formula or gate thresholds',  true,'SOVEREIGN_CANON'),
  /* Legal gates */
  ('approve:token_launch','approval','block',  'Token economy requires licensed legal counsel',              true,'LEGAL'),
  ('approve:access_grant','approval','require_owner','Access requires explicit owner approval',              true,'GOVERNANCE'),
  /* GDPR compliance — use enforce instead of require */
  ('compliance:erasure_30d',  'compliance','enforce','Delete user data within 30 days of erasure (GDPR Art.17)',true,'GDPR'),
  ('compliance:consent_first','compliance','enforce','Collect analytics only after explicit consent (GDPR Art.6)',false,'GDPR'),
  ('compliance:no_pii_logs',  'compliance','deny',   'Never log passwords, API keys, or PII in plain text',      true,'ISO27001'),
  /* Rate limits */
  ('rate:ai_queries',   'rate','limit','AI concierge: max 50 queries per member per day', false,'OPERATIONS'),
  ('rate:task_complete','rate','limit','Task completions: max 200 per member per day',    false,'OPERATIONS')
ON CONFLICT(policy_id) DO NOTHING;

-- ── POLICY EVALUATION LOG ─────────────────────────────────────────────────
-- Note: actor_id used instead of user_id to avoid confusion with profiles.id
CREATE TABLE IF NOT EXISTS public.policy_eval_log(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id    text        NOT NULL,
  actor_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  effect       text        NOT NULL,
  context      jsonb       DEFAULT '{}',
  reason       text,
  page         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pol_actor ON public.policy_eval_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pol_id    ON public.policy_eval_log(policy_id, effect, created_at DESC);
ALTER TABLE public.policy_eval_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner reads all evals" ON public.policy_eval_log;
CREATE POLICY "owner reads all evals" ON public.policy_eval_log
  FOR SELECT USING(public.is_platform_owner());
DROP POLICY IF EXISTS "member inserts eval" ON public.policy_eval_log;
CREATE POLICY "member inserts eval" ON public.policy_eval_log
  FOR INSERT TO authenticated WITH CHECK(public.is_platform_owner());

-- ── EVALUATE POLICY RPC ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.evaluate_policy(
  p_policy_id text,
  p_context   jsonb DEFAULT '{}'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE
  _policy   record;
  _pr       record;
  _uid      uuid := auth.uid();
  _auth_val numeric := 0;
BEGIN
  SELECT * INTO _policy FROM public.policy_rules WHERE policy_id=p_policy_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('effect','allow','reason','no_policy_found','policy_id',p_policy_id);
  END IF;

  -- Get member's computed authority
  SELECT axis_a, axis_b, axis_c, is_owner, subscription_tier
  INTO _pr
  FROM public.profiles WHERE id=_uid;

  IF FOUND AND _pr.is_owner THEN
    _auth_val := 27.8367;
  ELSIF FOUND THEN
    _auth_val := SQRT(
      POWER(COALESCE(_pr.axis_a,0.001),3) +
      POWER(COALESCE(_pr.axis_b,0.001),3) +
      POWER(COALESCE(_pr.axis_c,0.001),3)
    ) * 1.6180339887 / 2.7182818285;
  END IF;

  -- Log evaluation using actor_id (not user_id)
  INSERT INTO public.policy_eval_log(policy_id, actor_id, effect, context, reason)
  VALUES(p_policy_id, _uid, _policy.effect, p_context, 'server_evaluated');

  RETURN jsonb_build_object(
    'effect',      _policy.effect,
    'policy_id',   _policy.policy_id,
    'description', _policy.description,
    'is_critical', _policy.is_critical,
    'actor_auth',  _auth_val,
    'is_owner',    COALESCE(_pr.is_owner, false)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.evaluate_policy(text,jsonb) TO authenticated;
