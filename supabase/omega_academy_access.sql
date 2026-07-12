-- ============================================================================
-- SYD OMEGA 91717 -- ACADEMY ACCESS (Doc 2, implemented the SAFE way)
-- Doc 2 is a Solidity contract that MOVES CURRENCY. Per manifest s.11, token /
-- payment rails require licensed legal counsel (securities, money-transmission,
-- KYC/AML) BEFORE going live. So the access logic lives here in your stack,
-- DORMANT behind 'tokens_enabled' (default false). No value moves until you,
-- post-legal, flip the flag. Mirrors the contract's grant/expiry/stage logic.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY, bool_value boolean DEFAULT false, text_value text, updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key,bool_value) VALUES ('tokens_enabled',false)
  ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.academy_access (
  user_id     uuid PRIMARY KEY DEFAULT auth.uid(),
  expires_at  timestamptz,
  stage       int NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 12),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aa_read ON public.academy_access;
CREATE POLICY aa_read ON public.academy_access FOR SELECT USING (auth.uid()=user_id OR public.is_platform_owner());

-- has-active-access (mirrors hasActiveAcademyAccess) -- always safe to read
CREATE OR REPLACE FUNCTION public.has_academy_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT expires_at > now() FROM public.academy_access WHERE user_id=auth.uid()), false)
$$;

-- subscribe (mirrors processAcademySubscription) -- DORMANT until legal sign-off
CREATE OR REPLACE FUNCTION public.academy_subscribe()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enabled boolean; cur timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT bool_value INTO enabled FROM public.platform_settings WHERE key='tokens_enabled';
  IF NOT COALESCE(enabled,false) THEN
    RETURN jsonb_build_object('ok',false,'error','tokens_dormant','note','academy currency disabled until legal sign-off');
  END IF;
  SELECT expires_at INTO cur FROM public.academy_access WHERE user_id=auth.uid();
  INSERT INTO public.academy_access(user_id,expires_at,stage)
    VALUES (auth.uid(),
            CASE WHEN cur > now() THEN cur + interval '30 days' ELSE now() + interval '30 days' END,
            1)
    ON CONFLICT (user_id) DO UPDATE SET
      expires_at = CASE WHEN public.academy_access.expires_at > now()
                        THEN public.academy_access.expires_at + interval '30 days'
                        ELSE now() + interval '30 days' END,
      stage = GREATEST(public.academy_access.stage,1), updated_at=now();
  RETURN jsonb_build_object('ok',true,'expires', (SELECT expires_at FROM public.academy_access WHERE user_id=auth.uid()));
END;
$$;

-- promote stage 1..12 (mirrors updateUserStage, onlySovereign) ---------------
CREATE OR REPLACE FUNCTION public.academy_promote(p_user uuid, p_stage int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_stage < 1 OR p_stage > 12 THEN RETURN jsonb_build_object('ok',false,'error','stage_out_of_range'); END IF;
  INSERT INTO public.academy_access(user_id,stage) VALUES (p_user,p_stage)
    ON CONFLICT (user_id) DO UPDATE SET stage=p_stage, updated_at=now();
  RETURN jsonb_build_object('ok',true,'stage',p_stage);
END;
$$;

GRANT SELECT ON public.academy_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_academy_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_subscribe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_promote(uuid,int) TO authenticated;

COMMIT;
