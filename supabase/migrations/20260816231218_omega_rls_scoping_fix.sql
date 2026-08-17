-- ============================================================================
-- Ω SYD OMEGA 91717 — RLS INSERT/STORAGE SCOPING FIX
--
-- Byte-for-byte the same fix as supabase/omega_rls_scoping_fix.sql (see that
-- file for full rationale/evidence). This file exists specifically to match
-- the version string Supabase's own `apply_migration` tool recorded on the
-- remote database's migration-tracking table when this fix was applied
-- directly (2026-08-16, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this one breaks the directory's usual NNNN_<name>.sql convention.
--
-- Idempotent (DROP POLICY IF EXISTS; CREATE POLICY), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

-- (1) capability_kpi_log — restrict INSERT to owner, matching SELECT.
DROP POLICY IF EXISTS "member inserts kpi" ON public.capability_kpi_log;
DROP POLICY IF EXISTS "owner inserts kpi" ON public.capability_kpi_log;
CREATE POLICY "owner inserts kpi" ON public.capability_kpi_log
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_owner());

-- (2) policy_eval_log — same fix, same reasoning.
DROP POLICY IF EXISTS "member inserts eval" ON public.policy_eval_log;
DROP POLICY IF EXISTS "owner inserts eval" ON public.policy_eval_log;
CREATE POLICY "owner inserts eval" ON public.policy_eval_log
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_owner());

-- (3) threat_events — scope INSERT to the caller's own user_id.
DROP POLICY IF EXISTS "insert threat events" ON public.threat_events;
CREATE POLICY "insert threat events" ON public.threat_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- (4) telemetry_events — scope INSERT to the caller's own user_id.
DROP POLICY IF EXISTS "member inserts own telemetry" ON public.telemetry_events;
CREATE POLICY "member inserts own telemetry" ON public.telemetry_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- (5) storage "uploads" bucket — add the owner-bypass every other
-- owner-elevated policy in this schema already has, so a future KYC/
-- document-review feature can actually read what members submit.
DROP POLICY IF EXISTS "uploads read" ON storage.objects;
CREATE POLICY "uploads read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'uploads' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_platform_owner()
  ));
-- ===== end 20260816231218_omega_rls_scoping_fix.sql =====
