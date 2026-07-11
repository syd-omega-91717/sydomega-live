-- ============================================================================
-- SYD OMEGA 91717 -- CONSULTANCY REQUESTS (real booking backend, M2)
-- Turns the consultancy page from a static list into a working service:
-- a verified member submits a request in a domain; it saves to the DB; the
-- Sovereign owner sees and manages every request. Members see only their own.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.consult_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid(),
  domain     text NOT NULL,
  subject    text NOT NULL,
  message    text,
  status     text NOT NULL DEFAULT 'new',   -- new | reviewing | scheduled | closed
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consult_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_insert ON public.consult_requests;
CREATE POLICY cr_insert ON public.consult_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS cr_select ON public.consult_requests;
CREATE POLICY cr_select ON public.consult_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- member submits a request ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_consult_request(p_domain text, p_subject text, p_message text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_domain IS NULL OR p_subject IS NULL OR length(trim(p_subject))=0 THEN
    RETURN jsonb_build_object('ok',false,'error','missing_fields'); END IF;
  INSERT INTO public.consult_requests(user_id,domain,subject,message)
    VALUES (auth.uid(), left(p_domain,60), left(p_subject,200), left(coalesce(p_message,''),4000))
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$$;

-- member reads their own requests -------------------------------------------
CREATE OR REPLACE FUNCTION public.my_consult_requests()
RETURNS SETOF public.consult_requests LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.consult_requests WHERE user_id = auth.uid() ORDER BY created_at DESC;
$$;

-- owner updates status (onlySovereign) --------------------------------------
CREATE OR REPLACE FUNCTION public.set_consult_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('new','reviewing','scheduled','closed') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.consult_requests SET status=p_status WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

GRANT SELECT, INSERT ON public.consult_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_consult_request(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_consult_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_consult_status(uuid,text) TO authenticated;

COMMIT;
