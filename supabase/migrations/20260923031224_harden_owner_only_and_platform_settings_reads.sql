-- Ω SYD OMEGA 91717 — owner-only and platform-settings read hardening
BEGIN;

DROP POLICY IF EXISTS enterprise_audit_owner_read ON public.enterprise_audit;
DROP POLICY IF EXISTS "owner sees all audit" ON public.enterprise_audit;
CREATE POLICY "owner sees all audit" ON public.enterprise_audit FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS medals_select_merged ON public.medals;
CREATE POLICY medals_select_merged ON public.medals FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR private.is_platform_owner());

DROP POLICY IF EXISTS platform_settings_select ON public.platform_settings;
CREATE POLICY platform_settings_select ON public.platform_settings FOR SELECT TO authenticated
USING (private.is_platform_owner());

COMMIT;
