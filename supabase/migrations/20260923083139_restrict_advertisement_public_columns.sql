-- Ω SYD OMEGA 91717 — advertisement public-column minimization
BEGIN;

DROP POLICY IF EXISTS advertisements_select ON public.advertisements;
CREATE POLICY advertisements_select ON public.advertisements FOR SELECT TO anon, authenticated
USING (status = 'approved' OR private.is_platform_owner() OR submitted_by = (SELECT auth.uid()));

REVOKE SELECT ON public.advertisements FROM anon, authenticated;
GRANT SELECT (id, company, title, description, url, category, rate_tier, status, starts_at, ends_at, created_at)
ON public.advertisements TO anon, authenticated;

COMMIT;
