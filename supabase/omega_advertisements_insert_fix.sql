-- ============================================================================
-- Ω SYD OMEGA 91717 — ADVERTISEMENTS: MISSING INSERT POLICY FIX
--
-- HTML page audit: advertising.html's submitAd() lets a signed-in member
-- submit a self-service ad request (matching the page's own "SUBMISSION
-- RECEIVED. THE ARCHITECT WILL REVIEW WITHIN 48 HOURS." copy), and
-- chunk_06_migrations.sql already `GRANT INSERT ON public.advertisements TO
-- authenticated` and defines a SELECT policy scoped to
-- `status = 'approved' OR submitted_by = auth.uid()` -- both signal clear
-- intent that authenticated members were meant to be able to submit their
-- own ad request. But the only INSERT-capable RLS policy is
-- "owner_manage_ads" (FOR ALL, USING/WITH CHECK is_platform_owner()) -- so
-- despite the GRANT, RLS has always rejected every non-owner INSERT
-- regardless of column names (a GRANT without a matching RLS policy is
-- toothless -- RLS still blocks it). Confirmed by reading advertising.html's
-- submitAd() in full: it already always sets submitted_by to the caller's
-- own auth uid, matching the existing SELECT policy's scoping exactly.
--
-- (A companion HTML-side bug -- several wrong column names in the same
-- insert/select calls, e.g. headline/company_name for the real title/company
-- -- was fixed separately in advertising.html itself this session; this file
-- is the RLS half of the same finding.)
--
-- Idempotent (DROP POLICY IF EXISTS; CREATE POLICY), safe to re-run.
-- Not yet applied to the live database.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "member submits own ad" ON public.advertisements;
CREATE POLICY "member submits own ad" ON public.advertisements
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

COMMIT;
-- ===== end omega_advertisements_insert_fix.sql =====
