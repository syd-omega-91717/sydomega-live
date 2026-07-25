-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 05 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- WELCOME DEMO VIDEO TRACKING
-- Backs omega-demo-video.js: lets the platform remember that a member has
-- already seen the welcome demo, so it plays once (auto), not every visit.
-- Self-writable by the member (same pattern as omega_profile_fields.sql) --
-- the client sets this the moment the video ends or is skipped. Run any time.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS demo_watched_at timestamptz;

DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='profiles' AND column_name='demo_watched_at') THEN
    EXECUTE 'GRANT UPDATE (demo_watched_at) ON public.profiles TO authenticated';
  END IF;
END $g$;

COMMIT;
-- ===== end omega_demo_video.sql =====


-- ===== refinements.sql =====
-- SYD OMEGA 91717 -- publishing approval + background preference (idempotent)
-- Requires public.is_platform_owner() and public.publications, both created by
-- omega_backend_sync.sql (or the full omega_master_deploy.sql) -- run that first.
alter table public.publications add column if not exists status text not null default 'private';
alter table public.profiles add column if not exists bg_color text;

drop policy if exists "owner reads publications" on public.publications;
create policy "owner reads publications" on public.publications for select to authenticated using (public.is_platform_owner());
drop policy if exists "owner updates publications" on public.publications;
create policy "owner updates publications" on public.publications for update to authenticated using (public.is_platform_owner()) with check (true);
grant update on public.publications to authenticated;
-- ===== end refinements.sql =====


-- ===== ad_approval.sql =====
-- SYD OMEGA 91717 -- Ad approval lifecycle + owner role (idempotent; safe to re-run)
-- PREREQUISITE: run omega_master_deploy.sql first (creates profiles + is_platform_owner()).
-- Fixed to use public.is_platform_owner() instead of a direct profiles.is_owner
-- check -- the direct check is the exact pattern that caused the RLS recursion
-- bug (42P17) omega_master_deploy.sql's Section 12 exists to fix; using it here
-- would reintroduce that risk.
alter table public.profiles add column if not exists is_owner boolean not null default false;
alter table public.media_reservations alter column status set default 'submitted';

-- owner can read ALL reservations (members still read their own via existing policy)
drop policy if exists "owner reads all media" on public.media_reservations;
create policy "owner reads all media" on public.media_reservations for select to authenticated
  using (auth.uid() = user_id or public.is_platform_owner());

-- owner can update status of any reservation
-- NOTE: omega_marketing.sql's set_reservation_status() function is the safer path
-- (validates status is one of submitted|reviewing|approved|rejected|live) -- this
-- direct UPDATE policy is kept for compatibility but doesn't validate the value.
drop policy if exists "owner updates media" on public.media_reservations;
create policy "owner updates media" on public.media_reservations for update to authenticated
  using (public.is_platform_owner())
  with check (true);
grant update on public.media_reservations to authenticated;

-- ANOINT THE OWNER: replace the email with the address you signed up with, then run this line.
-- update public.profiles set is_owner = true where id = (select id from auth.users where email = 's.y.dagher@gmail.com');
-- ===== end ad_approval.sql =====


-- ===== omega_zero_start.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- VERIFIED MEMBERS BEGIN AT ZERO
-- Real bug: axis_a/b/c defaulted to 1, meaning every new signup started with
-- authority 1.73 -- already past the Genesis Gate (Gate I) threshold before
-- taking a single real action. This contradicts matrix.html's own documented
-- claim ("NEW MEMBERS: Start at coordinate 0.001, 0.001, 0.001") and the
-- platform's actual intent: members begin at zero and earn everything through
-- real use. The Architect/Owner is explicitly, permanently exempted -- always
-- anointed to absolute apex (9,9,9) regardless of this default.
-- Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ALTER COLUMN axis_a SET DEFAULT 0.001;
ALTER TABLE public.profiles ALTER COLUMN axis_b SET DEFAULT 0.001;
ALTER TABLE public.profiles ALTER COLUMN axis_c SET DEFAULT 0.001;

-- Safe backfill: only reset members who are EXACTLY at the old default
-- (1.000, 1.000, 1.000) AND have zero real evolution events recorded --
-- meaning they are still genuinely untouched, not someone who coincidentally
-- earned their way back to exactly 1,1,1 through real actions. Never touches
-- the owner (is_owner is always exempt).
UPDATE public.profiles p SET axis_a = 0.001, axis_b = 0.001, axis_c = 0.001
WHERE p.is_owner IS NOT TRUE
  AND p.axis_a = 1 AND p.axis_b = 1 AND p.axis_c = 1
  AND NOT EXISTS (SELECT 1 FROM public.evolution_events e WHERE e.user_id = p.id);

-- Re-confirm the owner is untouched and permanently at absolute apex,
-- regardless of any default change above (belt-and-suspenders, matches the
-- existing ANOINT pattern -- update the email if it's changed).
UPDATE public.profiles SET axis_a = 9.000, axis_b = 9.000, axis_c = 9.000
WHERE id IN (SELECT id FROM auth.users WHERE email IN ('s.y.dagher@gmail.com','slmndghr@gmail.com'));

COMMIT;

-- verification query -- run manually to check the result
-- SELECT id, display_name, axis_a, axis_b, axis_c, is_owner FROM public.profiles ORDER BY axis_a DESC LIMIT 20;
-- ===== end omega_zero_start.sql =====


-- ===== omega_rls_hardening.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- RLS HARDENING (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Five tables holding per-member private data were created in
-- omega_backend_sync.sql WITHOUT Row Level Security:
--
--   certificates, trophies, evolution_events, task_completions, contribution_log
--
-- In Supabase every table in the `public` schema is exposed through PostgREST.
-- With RLS disabled, Supabase's default privileges let ANY holder of the anon
-- key read the entire table. The anon key is public -- it is embedded in the
-- source of every page on the site. So before this migration, any visitor could
-- read EVERY member's certificates, trophies, evolution history, task history,
-- and contribution log, regardless of the page-level access gates.
--
-- Page gating (login screens, #app hiding) does NOT protect these tables --
-- it only hides the page shell. This file is the fix that actually protects
-- the data.
--
-- SAFE TO APPLY -- verified before writing:
--   * Every RPC touching these tables (complete_task, order_stats,
--     public_leaderboard, expire_trial, delete_account, submit_exam_result,
--     my_time_sovereign) is SECURITY DEFINER, so it bypasses RLS and keeps
--     working unchanged -- including the Hall aggregate stats.
--   * Every direct frontend query on these tables already filters by
--     .eq('user_id', <own session id>), so the "own rows only" policies below
--     match existing behaviour exactly. Nothing in the UI should change.
-- ============================================================================

-- ---------------------------------------------------------------- certificates
alter table public.certificates enable row level security;

drop policy if exists "own certificates read" on public.certificates;
create policy "own certificates read" on public.certificates
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own certificates insert" on public.certificates;
create policy "own certificates insert" on public.certificates
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.certificates from anon;
grant select, insert on public.certificates to authenticated;

-- -------------------------------------------------------------------- trophies
alter table public.trophies enable row level security;

drop policy if exists "own trophies read" on public.trophies;
create policy "own trophies read" on public.trophies
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own trophies insert" on public.trophies;
create policy "own trophies insert" on public.trophies
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.trophies from anon;
grant select, insert on public.trophies to authenticated;

-- ------------------------------------------------------------ evolution_events
alter table public.evolution_events enable row level security;

drop policy if exists "own evolution read" on public.evolution_events;
create policy "own evolution read" on public.evolution_events
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own evolution insert" on public.evolution_events;
create policy "own evolution insert" on public.evolution_events
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.evolution_events from anon;
grant select, insert on public.evolution_events to authenticated;

-- ----------------------------------------------------------- task_completions
alter table public.task_completions enable row level security;

drop policy if exists "own tasks read" on public.task_completions;
create policy "own tasks read" on public.task_completions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own tasks insert" on public.task_completions;
create policy "own tasks insert" on public.task_completions
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.task_completions from anon;
grant select, insert on public.task_completions to authenticated;

-- ----------------------------------------------------------- contribution_log
alter table public.contribution_log enable row level security;

drop policy if exists "own contributions read" on public.contribution_log;
create policy "own contributions read" on public.contribution_log
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own contributions insert" on public.contribution_log;
create policy "own contributions insert" on public.contribution_log
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.contribution_log from anon;
grant select, insert on public.contribution_log to authenticated;

-- ============================================================================
-- VERIFY AFTER RUNNING
-- Paste this into the Supabase SQL editor. Every row must show rls_enabled = t
-- and policy_count >= 2.
-- ============================================================================
-- select c.relname                as table_name,
--        c.relrowsecurity         as rls_enabled,
--        count(p.polname)         as policy_count
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   left join pg_policy p on p.polrelid = c.oid
--  where n.nspname = 'public'
--    and c.relname in ('certificates','trophies','evolution_events',
--                      'task_completions','contribution_log')
--  group by c.relname, c.relrowsecurity
--  order by c.relname;
-- ===== end omega_rls_hardening.sql =====


-- ===== omega_access_audit.sql =====
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
-- ===== end omega_access_audit.sql =====


-- ===== omega_indexes.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- PERFORMANCE INDEXES (idempotent; safe to re-run)
--
-- PASS C FINDING (measured, not estimated)
-- The schema has 42 tables but only 6 named indexes. Meanwhile the frontend
-- filters by user_id on almost every read:
--
--     .from('<table>').select(...).eq('user_id', <session user>)
--
-- Without an index on user_id, PostgreSQL performs a sequential scan of the
-- whole table for each of those reads. At current row counts this is invisible;
-- it degrades linearly as members join, and it degrades first on the pages
-- members use most.
--
-- Row Level Security makes this matter more, not less: every RLS policy of the
-- form USING (auth.uid() = user_id) is evaluated per row, so an unindexed
-- user_id means the policy check itself scans the table.
--
-- Tables below were selected by measuring actual .eq('user_id', ...) usage in
-- the shipped pages -- not by indexing everything indiscriminately.
--
-- CONCURRENTLY is deliberately NOT used: it cannot run inside a transaction
-- block, and these tables are small enough that a brief lock is harmless.
-- ============================================================================

-- family_nodes -- 5 call sites (family.html bloodline + heritage tabs)
CREATE INDEX IF NOT EXISTS family_nodes_user_idx
  ON public.family_nodes (user_id);

-- evolution_events -- 4 call sites (dashboard, matrix, account, profile feeds)
-- ordered by created_at DESC everywhere, so index both columns together
CREATE INDEX IF NOT EXISTS evolution_events_user_time_idx
  ON public.evolution_events (user_id, created_at DESC);

-- character_records -- profile.html character tab
CREATE INDEX IF NOT EXISTS character_records_user_idx
  ON public.character_records (user_id);

-- sovereign_points_ledger -- points.html, ordered by created_at DESC
CREATE INDEX IF NOT EXISTS sovereign_points_ledger_user_time_idx
  ON public.sovereign_points_ledger (user_id, created_at DESC);

-- consult_requests -- consultancy.html
CREATE INDEX IF NOT EXISTS consult_requests_user_idx
  ON public.consult_requests (user_id);

-- publications -- publishing.html
CREATE INDEX IF NOT EXISTS publications_user_idx
  ON public.publications (user_id);

-- media_reservations -- media/reservations flow
CREATE INDEX IF NOT EXISTS media_reservations_user_idx
  ON public.media_reservations (user_id);

-- commission_contracts -- contracts.html
CREATE INDEX IF NOT EXISTS commission_contracts_user_idx
  ON public.commission_contracts (user_id);

-- ----------------------------------------------------------------------------
-- Owner-side scans. approvals.html and the bg.js pending-count badge both
-- filter profiles by access state; these support that without scanning every
-- member row.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_access_idx
  ON public.profiles (access_approved, is_owner);

CREATE INDEX IF NOT EXISTS profiles_trial_idx
  ON public.profiles (is_trial, trial_expires_at)
  WHERE is_trial IS TRUE;

-- ============================================================================
-- VERIFY AFTER RUNNING
-- ============================================================================
-- select tablename, indexname from pg_indexes
--  where schemaname='public'
--    and indexname in ('family_nodes_user_idx','evolution_events_user_time_idx',
--                      'character_records_user_idx','sovereign_points_ledger_user_time_idx',
--                      'consult_requests_user_idx','publications_user_idx',
--                      'media_reservations_user_idx','commission_contracts_user_idx',
--                      'profiles_access_idx','profiles_trial_idx')
--  order by tablename;
--
-- Confirm an index is actually used (should say "Index Scan", not "Seq Scan"):
-- explain analyze select * from public.evolution_events
--  where user_id = auth.uid() order by created_at desc limit 8;
-- ===== end omega_indexes.sql =====


-- ===== omega_error_monitor.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- CLIENT ERROR MONITORING (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Runtime failures on the live site are currently invisible. A member hits a
-- broken page, nothing is recorded, and the only way anyone finds out is if
-- they happen to screenshot it. Every real bug this project has fixed was
-- discovered that way -- which does not scale past one member.
--
-- Static analysis cannot catch these: a page whose script is syntactically
-- perfect still throws at runtime when an element is missing, a fetch fails,
-- or data arrives in an unexpected shape.
--
-- This is deliberately NOT a third-party service (Sentry, LogRocket). Those
-- require an account, a key, and send your members' activity to another
-- company. This writes to your own database, under your own RLS.
--
-- PRIVACY
-- Stores the error message, source file/line, page path, and -- when the
-- reporter is signed in -- their user id, so a report can be tied to the
-- account that hit it. It does NOT store form contents, tokens, or page text.
-- Only the owner can read the table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_errors (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid,               -- NULL when the error happened signed-out
  page        text,               -- location.pathname
  message     text NOT NULL,
  source      text,               -- script url
  line_no     int,
  col_no      int,
  stack       text,               -- truncated client-side
  kind        text,               -- 'error' | 'unhandledrejection'
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_errors_time_idx ON public.client_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS client_errors_page_idx ON public.client_errors (page, created_at DESC);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

-- Owner-only read. No SELECT for ordinary members: this is operational data.
DROP POLICY IF EXISTS "owner reads client errors" ON public.client_errors;
CREATE POLICY "owner reads client errors" ON public.client_errors
  FOR SELECT TO authenticated USING (public.is_platform_owner());

-- No INSERT policy: rows are written only through the SECURITY DEFINER
-- function below, which sanitises and rate-limits.
REVOKE ALL ON public.client_errors FROM anon;
GRANT SELECT ON public.client_errors TO authenticated;

-- ---------------------------------------------------------------- report ---
-- Callable by anyone (signed in or not) so errors on the login and pending
-- pages are captured too. Hard limits prevent a broken loop from flooding the
-- table: max 20 rows per user (or per page when signed out) in any 10 minutes.
CREATE OR REPLACE FUNCTION public.report_client_error(
  p_page text, p_message text, p_source text DEFAULT NULL,
  p_line int DEFAULT NULL, p_col int DEFAULT NULL,
  p_stack text DEFAULT NULL, p_kind text DEFAULT 'error',
  p_ua text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_count int;
BEGIN
  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_message');
  END IF;

  SELECT count(*) INTO v_count
    FROM public.client_errors
   WHERE created_at > now() - interval '10 minutes'
     AND ((v_uid IS NOT NULL AND user_id = v_uid)
       OR (v_uid IS NULL AND user_id IS NULL AND page = left(p_page, 300)));

  IF v_count >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  INSERT INTO public.client_errors
    (user_id, page, message, source, line_no, col_no, stack, kind, user_agent)
  VALUES (v_uid,
          left(p_page, 300),
          left(p_message, 500),
          left(p_source, 300),
          p_line, p_col,
          left(p_stack, 2000),
          left(COALESCE(p_kind, 'error'), 40),
          left(p_ua, 300));

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_client_error(text,text,text,int,int,text,text,text)
  TO authenticated, anon;

-- ------------------------------------------------------------ owner view ---
-- Grouped summary: which pages are failing, how often, and most recently.
CREATE OR REPLACE FUNCTION public.error_summary(p_hours int DEFAULT 168)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO result
  FROM (
    SELECT page,
           message,
           kind,
           count(*)                    AS hits,
           count(DISTINCT user_id)     AS affected_members,
           max(created_at)             AS last_seen,
           min(created_at)             AS first_seen
      FROM public.client_errors
     WHERE created_at > now() - make_interval(hours => GREATEST(1, LEAST(COALESCE(p_hours,168), 2160)))
     GROUP BY page, message, kind
     ORDER BY count(*) DESC, max(created_at) DESC
     LIMIT 100
  ) t;

  RETURN jsonb_build_object('ok', true, 'rows', result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.error_summary(int) TO authenticated;

-- ============================================================================
-- VERIFY AFTER RUNNING
-- ============================================================================
-- select public.report_client_error('/test.html','verification row');
-- select page, message, created_at from public.client_errors order by id desc limit 5;
-- select public.error_summary(24);
-- ===== end omega_error_monitor.sql =====


-- ===== omega_subscription_dates.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- SUBSCRIPTION PERIOD START (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Members can see which tier they hold and when it renews, but not when it
-- began. profiles carries subscription_period_end with no matching start, and
-- my_subscription() therefore cannot return one. "What did I choose, when did
-- it start, when does it end" is the minimum a paid member should be able to
-- answer about their own money.
--
-- Adds the column, backfills it from Stripe's record where one exists, and
-- teaches both RPCs about it.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_period_start timestamptz;

-- Backfill: any member who already has an active period but no recorded start
-- is assumed to have begun one standard month before their renewal date. This
-- is an estimate for pre-existing rows only; every subscription recorded from
-- now on carries a true start supplied by Stripe.
UPDATE public.profiles
   SET subscription_period_start = subscription_period_end - interval '1 month'
 WHERE subscription_period_end IS NOT NULL
   AND subscription_period_start IS NULL;

-- ---------------------------------------------------------- member read ---
CREATE OR REPLACE FUNCTION public.my_subscription()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tier',             COALESCE(subscription_tier, 'none'),
    'status',           COALESCE(subscription_status, 'none'),
    -- membership_tier is an INTEGER tier rank (1-12), not a name. Two older
    -- migrations declare it `text DEFAULT 'INITIATE'`, but both use
    -- ADD COLUMN IF NOT EXISTS, which is a no-op because the integer column
    -- already existed -- so the database is integer and those lines never
    -- applied. Cast to text so this function is correct either way; the
    -- client does Number() on it (see OmegaCanon.tierUnlocks).
    'membership_tier',  COALESCE(membership_tier::text, '1'),
    'period_start',     subscription_period_start,
    'period_end',       subscription_period_end,
    'is_trial',         COALESCE(is_trial, false),
    'trial_expires_at', trial_expires_at,
    'payments_enabled', public.get_platform_flag('payments_enabled')
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_subscription() TO authenticated;

-- --------------------------------------------------- webhook write path ---
-- Extended with p_period_start. Defaulted so any existing caller that omits it
-- keeps working; Stripe supplies current_period_start when it fires.
-- p_tier_num is the INTEGER tier rank (1-12) that membership_tier stores.
-- p_tier remains the human-readable name for subscription_tier. Passing text
-- into the integer column is what produced:
--   ERROR: invalid input syntax for type integer: "INITIATE"
CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz,
  p_customer text, p_period_start timestamptz DEFAULT NULL,
  p_tier_num int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- service role or owner only; never a normal member
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.profiles
     SET subscription_tier         = p_tier,
         subscription_status       = p_status,
         subscription_period_end   = p_period_end,
         subscription_period_start = COALESCE(p_period_start, subscription_period_start, now()),
         stripe_customer_id        = COALESCE(p_customer, stripe_customer_id),
         membership_tier           = COALESCE(p_tier_num, membership_tier)
   WHERE id = p_uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================================
-- VERIFY
-- ============================================================================
-- select column_name from information_schema.columns
--  where table_name='profiles' and column_name like 'subscription_period%';
-- select public.my_subscription();
-- ===== end omega_subscription_dates.sql =====


-- ===== omega_membership_report.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- MEMBERSHIP & SUBSCRIPTION REPORT (owner only)
--
-- WHY THIS EXISTS
-- The owner could approve members one at a time but had no view of the whole:
-- how many members exist, which tiers they hold, how many are on trial, which
-- trials expire today, what renews this month, and whether any money is
-- actually recognised.
--
-- WHAT IT DOES *NOT* DO
-- It does not project, forecast, or annualise. There is no payments table in
-- this schema -- no invoices, no charges, no transaction history. The only
-- financial fact available is: which members currently carry
-- subscription_status = 'active'. While the economy is dormant that count is
-- zero, and this report will say zero rather than showing a hypothetical MRR
-- built from list prices and member counts. A number the owner cannot bank is
-- worse than no number.
--
-- Tier prices are supplied by the caller from omega-canon.json (the single
-- source of truth for pricing), so this function never carries a second,
-- drifting copy of the price list.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.membership_report(p_prices jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total        int;
  v_owner        int;
  v_pending      int;
  v_approved     int;
  v_rejected     int;
  v_trial        int;
  v_trial_expiring int;
  v_paid_active  int;
  v_recognised   numeric := 0;
  v_by_tier      jsonb;
  v_renewals     jsonb;
  v_trials       jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE is_owner IS TRUE),
    count(*) FILTER (WHERE access_approved IS NOT TRUE AND is_rejected IS NOT TRUE AND is_owner IS NOT TRUE),
    count(*) FILTER (WHERE access_approved IS TRUE),
    count(*) FILTER (WHERE is_rejected IS TRUE),
    count(*) FILTER (WHERE is_trial IS TRUE),
    count(*) FILTER (WHERE is_trial IS TRUE AND trial_expires_at IS NOT NULL
                       AND trial_expires_at <= now() + interval '24 hours'),
    count(*) FILTER (WHERE subscription_status = 'active')
  INTO v_total, v_owner, v_pending, v_approved, v_rejected, v_trial, v_trial_expiring, v_paid_active
  FROM public.profiles;

  -- Members grouped by the integer tier rank they hold.
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.tier), '[]'::jsonb) INTO v_by_tier
  FROM (
    SELECT COALESCE(membership_tier, 1)      AS tier,
           count(*)                          AS members,
           count(*) FILTER (WHERE subscription_status = 'active') AS paid,
           count(*) FILTER (WHERE is_trial IS TRUE)               AS on_trial
      FROM public.profiles
     WHERE is_owner IS NOT TRUE
     GROUP BY COALESCE(membership_tier, 1)
  ) t;

  -- Recognised revenue: ONLY members whose subscription is genuinely active,
  -- priced from the caller-supplied canon price list. Nothing else counts.
  IF p_prices IS NOT NULL THEN
    SELECT COALESCE(sum(
             COALESCE((p_prices ->> COALESCE(p.membership_tier, 1)::text)::numeric, 0)
           ), 0)
      INTO v_recognised
      FROM public.profiles p
     WHERE p.subscription_status = 'active'
       AND p.is_owner IS NOT TRUE;
  END IF;

  -- Renewals due in the next 30 days.
  SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.period_end), '[]'::jsonb) INTO v_renewals
  FROM (
    SELECT COALESCE(display_name, email, id::text) AS member,
           COALESCE(membership_tier, 1)            AS tier,
           subscription_status                     AS status,
           subscription_period_end                 AS period_end
      FROM public.profiles
     WHERE subscription_period_end IS NOT NULL
       AND subscription_period_end BETWEEN now() AND now() + interval '30 days'
     ORDER BY subscription_period_end
     LIMIT 50
  ) r;

  -- Trials still running, soonest to expire first.
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.expires_at), '[]'::jsonb) INTO v_trials
  FROM (
    SELECT COALESCE(display_name, email, id::text) AS member,
           trial_expires_at                        AS expires_at
      FROM public.profiles
     WHERE is_trial IS TRUE AND trial_expires_at IS NOT NULL
     ORDER BY trial_expires_at
     LIMIT 50
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'generated_at',     now(),
    'payments_enabled', public.get_platform_flag('payments_enabled'),
    'totals', jsonb_build_object(
      'members',         v_total,
      'owner',           v_owner,
      'pending',         v_pending,
      'approved',        v_approved,
      'rejected',        v_rejected,
      'on_trial',        v_trial,
      'trials_expiring', v_trial_expiring,
      'paid_active',     v_paid_active
    ),
    'recognised_monthly', v_recognised,
    'by_tier',            v_by_tier,
    'renewals_30d',       v_renewals,
    'trials',             v_trials
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.membership_report(jsonb) TO authenticated;

-- ============================================================================
-- VERIFY
-- ============================================================================
-- select public.membership_report();                     -- counts only
-- select public.membership_report('{"1":9.17,"2":19.17}'::jsonb);  -- with prices
-- ===== end omega_membership_report.sql =====


-- ===== omega_lattice_engine.sql =====
