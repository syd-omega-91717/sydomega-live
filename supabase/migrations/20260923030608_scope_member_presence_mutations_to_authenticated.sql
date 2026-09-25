-- Ω SYD OMEGA 91717 — presence mutation role hardening
BEGIN;

DROP POLICY IF EXISTS member_presence_self_delete ON public.member_presence;
DROP POLICY IF EXISTS member_presence_self_insert ON public.member_presence;
DROP POLICY IF EXISTS member_presence_self_update ON public.member_presence;

CREATE POLICY member_presence_self_delete ON public.member_presence
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY member_presence_self_insert ON public.member_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY member_presence_self_update ON public.member_presence
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;
