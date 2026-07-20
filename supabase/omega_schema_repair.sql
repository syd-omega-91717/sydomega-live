-- ============================================================================
-- SYD OMEGA 91717 -- LIVE SCHEMA REPAIR (idempotent; safe to re-run)
--
-- Built from three real production errors in the Supabase logs:
--   42501  permission denied for table medals                 -> 403 every read
--   42703  column profiles.demo_watched_at does not exist     -> 400
--   42703  column task_completions.created_at does not exist  -> 400
--
-- ROOT CAUSE
-- CREATE TABLE IF NOT EXISTS is a NO-OP on an existing table. Both
-- omega_master_deploy.sql and omega_backend_sync.sql declare
-- task_completions.created_at, but the live table predates that declaration,
-- so it never applied. The file is not evidence of what is deployed -- the
-- same trap that produced the membership_tier integer/text mismatch.
--
-- medals has RLS and two policies but NO GRANT. Postgres checks table
-- privileges BEFORE row policies, so reads failed with a hard 403 instead of
-- returning no rows. RLS without a GRANT is a locked door.
--
-- HOW THIS WAS BUILT
-- Every .select() and .order() column in the shipped pages AND shared scripts
-- was collected, then each column's type resolved from its real declaration in
-- CREATE TABLE bodies and ALTER ... ADD COLUMN statements. Two earlier drafts
-- were wrong and discarded: the first guessed types and would have created
-- axis_a as text and access_approved as text; the second scanned only .html
-- and therefore missed demo_watched_at, which is queried from
-- omega-demo-video.js. Nothing below is inferred -- any column whose declared
-- type could not be found was omitted rather than invented.
-- ============================================================================

-- ---------------------------------------------------------------- GRANTS ---
GRANT SELECT, INSERT ON public.medals TO authenticated;
REVOKE ALL ON public.medals FROM anon;

-- profiles carries no explicit grant anywhere in the migration set. It works
-- today on Supabase default privileges, but `medals` proved those defaults are
-- not universal -- and profiles is the one table that, if it ever loses access,
-- takes down sign-in, onboarding, the access gate and the whole matrix with it.
-- Stated explicitly rather than assumed. RLS still restricts rows to the owner.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ------------------------------------------------ COLUMNS THE APP QUERIES ---
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS is_on boolean,
  ADD COLUMN IF NOT EXISTS trigger_key text;

ALTER TABLE public.bloodline_nodes
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS cert_num int,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS milestone text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.character_records
  ADD COLUMN IF NOT EXISTS dominant_trait text,
  ADD COLUMN IF NOT EXISTS inheritance_mode text,
  ADD COLUMN IF NOT EXISTS legacy_statement text,
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.commission_contracts
  ADD COLUMN IF NOT EXISTS commission_rate numeric,
  ADD COLUMN IF NOT EXISTS commission_value numeric,
  ADD COLUMN IF NOT EXISTS counterparty text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS deal_value numeric,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS terms text;

ALTER TABLE public.consult_requests
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.dispatches
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS sign text;

ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS event_ref text;

ALTER TABLE public.evolution_events
  ADD COLUMN IF NOT EXISTS axis text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.family_nodes
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.health_logs
  ADD COLUMN IF NOT EXISTS body numeric,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS energy numeric,
  ADD COLUMN IF NOT EXISTS heart numeric,
  ADD COLUMN IF NOT EXISTS mind numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS soul numeric,
  ADD COLUMN IF NOT EXISTS total numeric;

ALTER TABLE public.heritage_records
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS era text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.medals
  ADD COLUMN IF NOT EXISTS earned_at timestamptz,
  ADD COLUMN IF NOT EXISTS medal_num int;

ALTER TABLE public.media_reservations
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS price_omega numeric,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS zone text;

ALTER TABLE public.member_perks
  ADD COLUMN IF NOT EXISTS perk_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_approved boolean,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS axis_a numeric,
  ADD COLUMN IF NOT EXISTS axis_b numeric,
  ADD COLUMN IF NOT EXISTS axis_c numeric,
  ADD COLUMN IF NOT EXISTS bg_color text,
  ADD COLUMN IF NOT EXISTS certificates_earned int,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS demo_watched_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS element text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_owner boolean,
  ADD COLUMN IF NOT EXISTS is_public boolean,
  ADD COLUMN IF NOT EXISTS is_trial boolean,
  ADD COLUMN IF NOT EXISTS kyc_status text,
  ADD COLUMN IF NOT EXISTS medals_earned int,
  ADD COLUMN IF NOT EXISTS membership_tier text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS sign text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean,
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS trophies_earned int;

ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.sim_trades
  ADD COLUMN IF NOT EXISTS amount int,
  ADD COLUMN IF NOT EXISTS from_user uuid,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS to_user uuid;

ALTER TABLE public.social_broadcasts
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS networks text;

ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS platform text;

ALTER TABLE public.sovereign_points_ledger
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS delta int,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS reason text;

ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS task text;

ALTER TABLE public.travel_journeys
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS purpose text;

ALTER TABLE public.trophies
  ADD COLUMN IF NOT EXISTS earned_at timestamptz,
  ADD COLUMN IF NOT EXISTS trophy_num int;

-- ============================================================================
-- VERIFY -- each should return zero rows
-- ============================================================================
-- select 'medals grant missing' where not exists (
--   select 1 from information_schema.role_table_grants
--    where table_schema='public' and table_name='medals' and grantee='authenticated');
-- select 'task_completions.created_at missing' where not exists (
--   select 1 from information_schema.columns
--    where table_schema='public' and table_name='task_completions' and column_name='created_at');
-- select 'profiles.demo_watched_at missing' where not exists (
--   select 1 from information_schema.columns
--    where table_schema='public' and table_name='profiles' and column_name='demo_watched_at');
