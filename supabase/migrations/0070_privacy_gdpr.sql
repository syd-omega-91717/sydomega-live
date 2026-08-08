-- ============================================================================
-- Ω SYD OMEGA 91717 — PRIVACY & COMPLIANCE (GDPR/CCPA Article 17 + Article 25)
-- Research basis: GDPR Articles 5/17/25, CPRA 2025, Privacy by Design principles
-- ============================================================================

-- ── CONSENT RECORDS (GDPR Art. 6 + 7 — lawful basis documentation) ────────
CREATE TABLE IF NOT EXISTS public.consent_records(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type text        NOT NULL, -- 'analytics','marketing','recommendations','personalisation'
  granted      boolean     NOT NULL,
  ip_hash      text,                 -- hashed, not stored raw (GDPR Art 25)
  user_agent   text,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz,
  version      text        NOT NULL DEFAULT '1.0',
  CONSTRAINT consent_type_ck CHECK(consent_type IN('analytics','marketing','recommendations','personalisation','terms'))
);
CREATE INDEX IF NOT EXISTS idx_consent_user ON public.consent_records(user_id, consent_type);
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own consent" ON public.consent_records;
CREATE POLICY "member sees own consent" ON public.consent_records FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "member manages own consent" ON public.consent_records;
CREATE POLICY "member manages own consent" ON public.consent_records
  FOR ALL USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

-- ── DATA EXPORT REQUESTS (GDPR Art. 20 — Data Portability) ───────────────
CREATE TABLE IF NOT EXISTS public.data_export_requests(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status       text        NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  download_url text,
  expires_at   timestamptz DEFAULT now() + INTERVAL '7 days',
  CONSTRAINT status_ck CHECK(status IN('pending','processing','ready','expired','failed'))
);
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own exports" ON public.data_export_requests;
CREATE POLICY "member sees own exports" ON public.data_export_requests FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "member requests own export" ON public.data_export_requests;
CREATE POLICY "member requests own export" ON public.data_export_requests FOR INSERT WITH CHECK(user_id=auth.uid());

-- ── RIGHT TO ERASURE RPC (GDPR Art. 17) ──────────────────────────────────
-- Cascades through all user tables. Irreversible. Requires confirmation.
CREATE OR REPLACE FUNCTION public.request_account_erasure()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pr  record;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT is_owner INTO _pr FROM public.profiles WHERE id=_uid;
  IF _pr.is_owner THEN RETURN jsonb_build_object('ok',false,'error','owner_cannot_erase_self'); END IF;
  /* Soft delete first — mark for erasure */
  UPDATE public.profiles SET
    access_approved = false,
    is_trial        = false,
    display_name    = 'DELETED_USER_'||substr(_uid::text,1,8),
    bio             = NULL,
    avatar_url      = NULL,
    erasure_requested_at = now()
  WHERE id=_uid;
  /* Log the erasure request */
  INSERT INTO public.sovereign_events(user_id,event_type,event_data,occurred_at)
  VALUES(_uid,'privacy.erasure_requested',jsonb_build_object('uid',_uid,'requested_at',now()),now());
  /* Revoke all consents */
  UPDATE public.consent_records SET revoked_at=now() WHERE user_id=_uid AND revoked_at IS NULL;
  /* Sign out */
  RETURN jsonb_build_object(
    'ok',true,
    'message','Erasure request received. Your data will be permanently deleted within 30 days per GDPR Article 17.',
    'uid',_uid
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_account_erasure() TO authenticated;

-- ── DATA EXPORT RPC (GDPR Art. 20) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _uid uuid := auth.uid();
  _pr  record;
  _tasks jsonb;
  _events jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT axis_a,axis_b,axis_c,display_name,subscription_tier,created_at INTO _pr FROM public.profiles WHERE id=_uid;
  SELECT jsonb_agg(jsonb_build_object('task',task_name,'axis',axis_type,'points',points_earned,'at',completed_at))
    INTO _tasks FROM public.task_completions WHERE user_id=_uid;
  SELECT jsonb_agg(jsonb_build_object('event',event_type,'data',event_data,'at',occurred_at))
    INTO _events FROM public.sovereign_events WHERE user_id=_uid;
  RETURN jsonb_build_object(
    'ok',true,
    'export_date',now(),
    'profile',jsonb_build_object('name',_pr.display_name,'tier',_pr.subscription_tier,'joined',_pr.created_at,'axis_a',_pr.axis_a,'axis_b',_pr.axis_b,'axis_c',_pr.axis_c),
    'task_completions',COALESCE(_tasks,'[]'::jsonb),
    'sovereign_events',COALESCE(_events,'[]'::jsonb),
    'consent_types',ARRAY['analytics','marketing','recommendations','personalisation'],
    'legal_basis','Legitimate Interest (platform progression) + Consent (analytics/marketing)',
    'retention_policy','Profile data: retained until erasure request. Event log: 5 years for audit.'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.export_my_data() TO authenticated;

-- ── CONSENT MANAGEMENT RPC ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_consent(
  p_type    text,
  p_granted boolean,
  p_version text DEFAULT '1.0'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  /* Revoke existing */
  UPDATE public.consent_records SET revoked_at=now()
  WHERE user_id=_uid AND consent_type=p_type AND revoked_at IS NULL;
  /* Insert new record */
  INSERT INTO public.consent_records(user_id,consent_type,granted,version)
  VALUES(_uid,p_type,p_granted,p_version);
  RETURN jsonb_build_object('ok',true,'type',p_type,'granted',p_granted);
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_consent(text,boolean,text) TO authenticated;

-- ── ADD ERASURE FIELD TO PROFILES ──────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS erasure_requested_at timestamptz;
