-- ============================================================================
-- Ω SYD OMEGA 91717 — ADVERTISEMENTS: MISSING INSERT POLICY FIX
--
-- Byte-for-byte the same fix as supabase/omega_advertisements_insert_fix.sql
-- (see that file for full rationale/evidence). This file exists specifically
-- to match the version string Supabase's own `apply_migration` tool recorded
-- on the remote database's migration-tracking table when this fix was
-- applied directly (2026-08-17, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this one breaks the directory's usual NNNN_<name>.sql convention.
--
-- HTML page audit: advertising.html's submitAd() lets a signed-in member
-- submit a self-service ad request (matching the page's own "SUBMISSION
-- RECEIVED. THE ARCHITECT WILL REVIEW WITHIN 48 HOURS." copy), and
-- chunk_06_migrations.sql already `GRANT INSERT ON public.advertisements TO
-- authenticated` and defines a SELECT policy scoped to
-- `status = 'approved' OR submitted_by = auth.uid()` -- both signal clear
-- intent that authenticated members were meant to be able to submit their
-- own ad request. But the only INSERT-capable RLS policy was
-- "owner_manage_ads" (FOR ALL, USING/WITH CHECK is_platform_owner()) -- so
-- despite the GRANT, RLS rejected every non-owner INSERT regardless of
-- column names (a GRANT without a matching RLS policy is toothless -- RLS
-- still blocks it). Confirmed live via pg_policies before applying: only
-- owner_manage_ads and read_approved_ads existed on public.advertisements,
-- no INSERT policy for a non-owner member.
--
-- Idempotent (DROP POLICY IF EXISTS; CREATE POLICY), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DROP POLICY IF EXISTS "member submits own ad" ON public.advertisements;
CREATE POLICY "member submits own ad" ON public.advertisements
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());
