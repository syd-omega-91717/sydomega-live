-- ============================================================================
-- SYD OMEGA 91717 -- PAYMENTS SCAFFOLD (DORMANT until legal clears)
-- Subscriptions for the 9 material tiers ($9.17 - $917.17 / month). Everything
-- here is INERT until BOTH conditions are met by the founder:
--   (1) platform_settings.payments_enabled = true  (flip via set_platform_flag)
--   (2) the Stripe secret keys are set on the Edge Functions
-- No charge can occur until the Sovereign turns it on. Safe + re-runnable.
-- ============================================================================
BEGIN;

-- platform-wide feature flags (founder-controlled) ---------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  bool_value boolean DEFAULT false,
  text_value text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key, bool_value)
  VALUES ('payments_enabled', false)
  ON CONFLICT (key) DO NOTHING;   -- default OFF; never force-enable on re-run
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_settings_read ON public.platform_settings;
CREATE POLICY platform_settings_read ON public.platform_settings FOR SELECT USING (true);

-- subscription columns on the member profile ---------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status    text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- read a flag (public; returns false when unset) ------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_flag(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT bool_value FROM public.platform_settings WHERE key=p_key), false);
$$;

-- flip a flag (FOUNDER ONLY -- this is how payments get switched on) ----------
CREATE OR REPLACE FUNCTION public.set_platform_flag(p_key text, p_val boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  INSERT INTO public.platform_settings(key,bool_value,updated_at)
    VALUES (p_key,p_val,now())
    ON CONFLICT (key) DO UPDATE SET bool_value=excluded.bool_value, updated_at=now();
  RETURN jsonb_build_object('ok',true,'key',p_key,'value',p_val);
END;
$$;

-- a member reads their own subscription --------------------------------------
CREATE OR REPLACE FUNCTION public.my_subscription()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tier',   COALESCE(subscription_tier,'none'),
    'status', COALESCE(subscription_status,'none'),
    'period_end', subscription_period_end,
    'payments_enabled', public.get_platform_flag('payments_enabled')
  ) FROM public.profiles WHERE id = auth.uid();
$$;

-- the Stripe webhook (service role) records a subscription result ------------
-- callable only by the service role or the owner; never by a normal member.
CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz, p_customer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_end = p_period_end,
    stripe_customer_id = COALESCE(p_customer, stripe_customer_id),
    membership_tier = CASE WHEN p_status IN ('active','trialing') THEN upper(p_tier) ELSE membership_tier END
  WHERE id = p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'tier',p_tier,'status',p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_flag(text)                             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_platform_flag(text, boolean)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_subscription()                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription(uuid,text,text,timestamptz,text) TO authenticated, service_role;

COMMIT;
