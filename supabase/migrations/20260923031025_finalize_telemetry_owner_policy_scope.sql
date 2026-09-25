-- Ω SYD OMEGA 91717 — reconcile the telemetry owner-read boundary.
-- This history entry was applied to the live project as 20260923031025.
-- Keep the canonical owner-only telemetry read policy reproducible for fresh
-- environments; the operation is idempotent.
BEGIN;
DROP POLICY IF EXISTS "owner reads all telemetry" ON public.telemetry_events;
CREATE POLICY "owner reads all telemetry"
  ON public.telemetry_events
  FOR SELECT TO authenticated
  USING (private.is_platform_owner());
COMMIT;
