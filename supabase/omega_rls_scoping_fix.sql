-- ============================================================================
-- Ω SYD OMEGA 91717 — RLS INSERT/STORAGE SCOPING FIX
--
-- Session RLS audit: every table with RLS enabled was checked (audit.py's
-- check 4 confirms 0 tables missing "ENABLE ROW LEVEL SECURITY" entirely --
-- this file is about policy *correctness*, not presence). Cross-referenced
-- every FOR INSERT/UPDATE/ALL policy's WITH CHECK clause against whether the
-- underlying table has a user-identity column (user_id/actor_id) that should
-- be scoping it. Four real gaps found, all the same shape: a WITH CHECK(true)
-- (or, for storage, a missing owner-bypass) that lets any authenticated
-- account write/read rows it shouldn't be able to, via a direct REST call to
-- the anon/publishable key -- not through the app's own UI, which never
-- exercises the gap, but RLS is the actual authorization boundary here
-- (CLAUDE.md §5), not application code.
--
-- 1) capability_kpi_log -- FOR SELECT is owner-only (omega_capability_
--    registry.sql), but FOR INSERT was WITH CHECK(true): any authenticated
--    account (including one still pending approval) could inject arbitrary
--    KPI rows into a table only the platform owner is meant to see, feeding
--    false capability-health data into the owner's monitoring view.
--    Confirmed via full-repo grep: zero client code (JS or edge functions)
--    ever writes to this table today, so tightening it breaks nothing live.
--    Fixed by restricting INSERT to the owner too, matching SELECT.
--
-- 2) policy_eval_log -- identical shape to (1): FOR SELECT owner-only
--    (omega_policy_engine.sql), FOR INSERT WITH CHECK(true), zero client
--    writers anywhere in the repo. Same fix.
--
-- 3) threat_events -- FOR SELECT/manage is owner-only (omega_threat.sql),
--    FOR INSERT was WITH CHECK(true) with NO scoping to the table's own
--    user_id column -- worse than (1)/(2) because a malicious signed-up
--    account could insert a row *attributing* threat_type values like
--    'brute_force' or 'privilege_escalation' to a DIFFERENT member's
--    user_id, polluting/framing the owner's SOC dashboard (dashboard.html,
--    observatory.html both show a threat count). Zero client writers exist
--    today (confirmed via grep -- only reads, for the dashboard counts), so
--    this doesn't break anything live. Fixed with `auth.uid() = user_id`
--    rather than owner-only, since the table's own design (a user_id column
--    exists at all) implies the intent is eventual self-reported client
--    telemetry ("this session looks suspicious"), not owner-only writes --
--    this preserves that future capability while closing the impersonation
--    gap.
--
-- 4) telemetry_events -- has a real, currently-working client writer
--    (omega-telemetry.js's track()/flush(), audited this session and found
--    correct), which always sets user_id to the authenticated caller's own
--    profile id before any insert fires (confirmed by reading the source:
--    _uid is only ever set from the omega:populated event's own profile,
--    and flush() requires _uid to be set first). Tightening WITH CHECK to
--    `auth.uid() = user_id` therefore doesn't break the real write path --
--    it just closes the same class of spoofing gap as (3) for analytics
--    events. (platform_metrics and platform_events were checked too and
--    deliberately left alone: platform_metrics has no user_id column at
--    all -- it's a platform-level aggregate, not a per-member table -- so
--    WITH CHECK(true) is correct there, not a gap; platform_events'
--    legitimate writers (omega-sovereign-os.js) never set user_id either,
--    by design, for anonymous-until-populated beacons, so scoping it would
--    break the real write path instead of closing a gap.)
--
-- 5) storage "uploads" bucket read policy (storage.sql) -- a member can
--    submit a KYC document (profile.html's upload flow writes into
--    uploads/<their-uid>/... and sets profiles.kyc_doc_path) but the
--    bucket's read policy only ever allowed a member to read their OWN
--    folder -- there is no owner-bypass, unlike every other owner-elevated
--    policy in this schema. No page currently reads another member's KYC
--    doc (grep confirms approvals.html has zero KYC references -- the
--    review UI was never built), so this isn't exploited today, but it
--    silently blocks the review half of a half-built feature (submission
--    works, review can't) and is a real, narrow, evidence-based gap to
--    close now rather than rediscover later when a review UI is built.
--    Fixed by adding the same is_platform_owner() OR-clause used
--    everywhere else in this schema.
--
-- Idempotent (DROP POLICY IF EXISTS; CREATE POLICY), safe to re-run.
-- Not yet applied to the live database.
-- ============================================================================

BEGIN;

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

COMMIT;
-- ===== end omega_rls_scoping_fix.sql =====
