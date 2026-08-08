-- ============================================================================
-- SYD OMEGA 91717 -- ACCESS DECISION AUDIT TRAIL (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Book 147, Article XIII requires that every constitutional action possess a
-- responsible authority, documentation, audit records and version history.
-- Granting, refusing or revoking a member's access to the platform is the most
-- consequential constitutional action the Order performs -- and until now it
-- left no trace whatsoever. approvals.html simply issued:
--
--     UPDATE profiles SET access_approved = true ... WHERE id = <member>
--
-- There was no record of WHO decided, WHEN, or what the prior state was. If a
-- member disputed a rejection, or access was revoked unexpectedly, nothing in
-- the system could answer the question.
--
-- WHY A TRIGGER AND NOT FRONTEND CODE
-- Access can change from several paths: the approve_member / reject_member /
-- revoke_member / grant_permanent_access / expire_trial RPCs, direct UPDATEs
-- from approvals.html, the owner-enforcement block in bg.js, and manual edits
-- in the Supabase SQL editor. Logging from the frontend would miss most of
-- these. A trigger on the table itself cannot be bypassed by any caller, so
-- the audit requirement is satisfied structurally rather than by convention.
--
-- PRIVACY
-- Read access is owner-only. The rows record access-state transitions, not
-- personal data.
-- ============================================================================

-- ------------------------------------------------------------------ table ---
CREATE TABLE IF NOT EXISTS public.access_audit (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id  uuid NOT NULL,          -- whose access changed
  actor_id    uuid,                   -- who caused it (NULL = system / SQL editor)
  action      text NOT NULL,          -- see derive logic below
  prev        jsonb,                  -- access state before
  next        jsonb,                  -- access state after
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_audit_subject_idx ON public.access_audit (subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_audit_created_idx ON public.access_audit (created_at DESC);

-- -------------------------------------------------------------------- rls ---
ALTER TABLE public.access_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner reads access audit" ON public.access_audit;
CREATE POLICY "owner reads access audit" ON public.access_audit
  FOR SELECT TO authenticated USING (public.is_platform_owner());

-- No INSERT policy on purpose: rows are written only by the SECURITY DEFINER
-- trigger below, never directly by any client.
REVOKE ALL ON public.access_audit FROM anon;
GRANT SELECT ON public.access_audit TO authenticated;

-- ---------------------------------------------------------------- trigger ---
CREATE OR REPLACE FUNCTION public.log_access_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_action text;
  v_prev   jsonb;
  v_next   jsonb;
BEGIN
  -- Only record when an access-relevant field actually changed.
  IF  NEW.access_approved  IS NOT DISTINCT FROM OLD.access_approved
  AND NEW.is_trial         IS NOT DISTINCT FROM OLD.is_trial
  AND NEW.is_rejected      IS NOT DISTINCT FROM OLD.is_rejected
  AND NEW.trial_expires_at IS NOT DISTINCT FROM OLD.trial_expires_at
  THEN
    RETURN NEW;
  END IF;

  -- Derive a human-readable action from the transition.
  IF NEW.is_rejected IS TRUE AND OLD.is_rejected IS DISTINCT FROM TRUE THEN
    v_action := 'rejected';
  ELSIF NEW.access_approved IS TRUE AND OLD.access_approved IS DISTINCT FROM TRUE THEN
    v_action := CASE WHEN NEW.is_trial IS TRUE THEN 'trial_granted' ELSE 'permanent_granted' END;
  ELSIF NEW.access_approved IS TRUE AND OLD.is_trial IS TRUE AND NEW.is_trial IS NOT TRUE THEN
    v_action := 'permanent_granted';
  ELSIF OLD.access_approved IS TRUE AND NEW.access_approved IS NOT TRUE THEN
    v_action := CASE WHEN OLD.is_trial IS TRUE THEN 'trial_expired' ELSE 'revoked' END;
  ELSE
    v_action := 'access_changed';
  END IF;

  v_prev := jsonb_build_object(
    'access_approved',  OLD.access_approved,
    'is_trial',         OLD.is_trial,
    'is_rejected',      OLD.is_rejected,
    'trial_expires_at', OLD.trial_expires_at);
  v_next := jsonb_build_object(
    'access_approved',  NEW.access_approved,
    'is_trial',         NEW.is_trial,
    'is_rejected',      NEW.is_rejected,
    'trial_expires_at', NEW.trial_expires_at);

  INSERT INTO public.access_audit (subject_id, actor_id, action, prev, next)
  VALUES (NEW.id, auth.uid(), v_action, v_prev, v_next);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_access_decision ON public.profiles;
CREATE TRIGGER trg_log_access_decision
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_access_decision();

-- ------------------------------------------------------- owner read RPC ---
-- Returns the recent access decision history with the subject's display name
-- and email resolved, so approvals.html can render it without needing broad
-- read access to profiles.
CREATE OR REPLACE FUNCTION public.access_audit_log(p_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT a.id,
           a.action,
           a.created_at,
           a.prev,
           a.next,
           COALESCE(p.display_name, p.email, a.subject_id::text) AS subject,
           COALESCE(act.display_name, act.email, 'system')       AS actor
      FROM public.access_audit a
      LEFT JOIN public.profiles p   ON p.id   = a.subject_id
      LEFT JOIN public.profiles act ON act.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 500))
  ) t;

  RETURN jsonb_build_object('ok', true, 'rows', result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.access_audit_log(int) TO authenticated;

-- ============================================================================
-- VERIFY AFTER RUNNING (paste into the Supabase SQL editor)
-- ============================================================================
-- select tgname, tgenabled from pg_trigger
--  where tgrelid = 'public.profiles'::regclass and tgname = 'trg_log_access_decision';
--
-- -- then approve someone in approvals.html and run:
-- select action, created_at, prev, next from public.access_audit order by id desc limit 5;
