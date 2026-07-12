-- ============================================================================
-- SYD OMEGA 91717 -- TOKEN ECONOMY (section 6) -- DORMANT / LEGAL-GATED
-- The 12 sovereign tokens (one per sign/track). Balances are readable so the
-- vault can display them, but ALL earning/spending is DORMANT behind the
-- 'tokens_enabled' flag (default FALSE) until legal sign-off (section 11).
-- Nothing here can move value until you deliberately enable it. Safe RLS.
-- ============================================================================
BEGIN;

-- feature-flag store (shared with payments; create if absent) ----------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY, bool_value boolean DEFAULT false, text_value text, updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key,bool_value) VALUES ('tokens_enabled',false)
  ON CONFLICT (key) DO NOTHING;
-- was missing RLS entirely -- this table gates tokens/payments sitewide, so an
-- unrestricted table is a real risk (readable/writable beyond intent by default).
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_read ON public.platform_settings;
CREATE POLICY ps_read ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS ps_write ON public.platform_settings;
CREATE POLICY ps_write ON public.platform_settings FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
GRANT SELECT ON public.platform_settings TO authenticated, anon;

-- the 12 sovereign tokens (code -> sign) -------------------------------------
CREATE TABLE IF NOT EXISTS public.token_catalog (
  code text PRIMARY KEY, sign text NOT NULL, element text, ord int
);
INSERT INTO public.token_catalog(code,sign,element,ord) VALUES
  ('PYRON','Aries','Fire',1),('AURUM','Taurus','Metal',2),('ZEPHYR','Gemini','Wind',3),
  ('NEREID','Cancer','Water',4),('SOLARI','Leo','Fire',5),('ARENITE','Virgo','Sand',6),
  ('FORGEON','Libra','Wind',7),('STYX','Scorpio','Water',8),('EMBER','Sagittarius','Fire',9),
  ('FERRUM','Capricorn','Metal',10),('AETHER','Aquarius','Wind',11),('ABYSS','Pisces','Water',12)
  ON CONFLICT (code) DO NOTHING;

-- per-member balances --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.token_balances (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  token   text NOT NULL REFERENCES public.token_catalog(code),
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_catalog  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tb_read ON public.token_balances;
CREATE POLICY tb_read ON public.token_balances FOR SELECT USING (auth.uid()=user_id OR public.is_platform_owner());
DROP POLICY IF EXISTS tc_read ON public.token_catalog;
CREATE POLICY tc_read ON public.token_catalog FOR SELECT USING (true);

-- read my 12 balances (seeds zero rows; always safe) -------------------------
CREATE OR REPLACE FUNCTION public.my_token_balances()
RETURNS TABLE(code text, sign text, element text, balance numeric, ord int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.token_balances(user_id,token,balance)
    SELECT auth.uid(), c.code, 0 FROM public.token_catalog c
    ON CONFLICT (user_id,token) DO NOTHING;
  RETURN QUERY
    SELECT c.code,c.sign,c.element,COALESCE(b.balance,0),c.ord
    FROM public.token_catalog c
    LEFT JOIN public.token_balances b ON b.token=c.code AND b.user_id=auth.uid()
    ORDER BY c.ord;
END;
$$;

-- award tokens -- DORMANT: refuses unless the owner has enabled the economy ---
CREATE OR REPLACE FUNCTION public.award_token(p_user uuid, p_token text, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enabled boolean;
BEGIN
  SELECT bool_value INTO enabled FROM public.platform_settings WHERE key='tokens_enabled';
  IF NOT COALESCE(enabled,false) THEN
    RETURN jsonb_build_object('ok',false,'error','tokens_dormant','note','economy disabled until legal sign-off');
  END IF;
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','owner_only');
  END IF;
  INSERT INTO public.token_balances(user_id,token,balance) VALUES (p_user,p_token,GREATEST(0,p_amount))
    ON CONFLICT (user_id,token) DO UPDATE SET balance=public.token_balances.balance+GREATEST(0,p_amount), updated_at=now();
  RETURN jsonb_build_object('ok',true,'token',p_token,'amount',p_amount);
END;
$$;

GRANT SELECT ON public.token_catalog, public.token_balances TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.my_token_balances() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_token(uuid,text,numeric) TO authenticated;

COMMIT;
