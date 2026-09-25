-- Ω SYD OMEGA 91717 — sensitive RLS read hardening
-- Remove broad public reads from tables containing owner identifiers,
-- presence/session telemetry, and personal oath/hash records.
BEGIN;

DROP POLICY IF EXISTS platform_owners_read ON public.platform_owners;

DROP POLICY IF EXISTS member_presence_select ON public.member_presence;
CREATE POLICY member_presence_select
  ON public.member_presence
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS oaths_read ON public.oaths;
CREATE POLICY oaths_read
  ON public.oaths
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMIT;
