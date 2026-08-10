-- ============================================================================
-- SYD OMEGA 91717 -- CONSULTANCY REQUESTS (real booking backend, M2)
-- Supersedes BOTH consult_requests.sql and the previous version of this file --
-- neither actually matched consultancy.html's real insert call at the time.
-- consultancy.html has since changed again: it now sends
-- {domain, contact, preferred_time, brief} (consultancy.html:157) -- "contact"
-- and "preferred_time" did not exist in this table, so every submission
-- errored with "column does not exist" (shown to the user -- not silent, but
-- the booking flow was completely non-functional). Added both columns below;
-- kept message/urgency/commission_rate/confidentiality_accepted from the
-- earlier page version rather than dropping them -- no destructive schema
-- changes on a table that may already hold rows. Delete consult_requests.sql
-- after running this; do not run it, it will fight this schema (different id
-- type, requires a "subject" column this page never sends). Idempotent --
-- safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.consult_requests (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL DEFAULT auth.uid(),
  domain                   text NOT NULL,
  contact                  text,
  preferred_time           text,
  brief                    text,
  message                  text,
  urgency                  text,
  commission_rate          numeric,
  confidentiality_accepted boolean NOT NULL DEFAULT false,
  status                   text NOT NULL DEFAULT 'pending',  -- pending | reviewing | scheduled | closed
  created_at               timestamptz NOT NULL DEFAULT now()
);
-- self-heal an older copy of any prior schema up to this one
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS commission_rate numeric;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS confidentiality_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS contact text;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS preferred_time text;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS brief text;
-- if an older run left subject as NOT NULL, relax it -- this page never sends it
DO $relax$
BEGIN
  BEGIN ALTER TABLE public.consult_requests ALTER COLUMN subject DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END;
END $relax$;

ALTER TABLE public.consult_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_insert ON public.consult_requests;
CREATE POLICY cr_insert ON public.consult_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS cr_select ON public.consult_requests;
CREATE POLICY cr_select ON public.consult_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- owner updates status (owner only) ------------------------------------------
CREATE OR REPLACE FUNCTION public.set_consult_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('pending','reviewing','scheduled','closed') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.consult_requests SET status=p_status WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

GRANT SELECT, INSERT ON public.consult_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_consult_status(uuid,text) TO authenticated;

COMMIT;
