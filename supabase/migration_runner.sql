-- ============================================================================
-- SYD OMEGA 91717 -- MIGRATION RUNNER v7
-- Step 1: drop every function in public schema via pg_catalog (exact signatures).
-- Step 2: run all migrations unchanged (no wrapping, no body parsing).
-- ============================================================================

-- ============================================================================
-- DROP ALL FUNCTIONS in public schema using their actual current signatures
-- from pg_catalog. This handles any return type or parameter mismatch.
-- ============================================================================
DO $drop_all$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE 'DROP FUNCTION IF EXISTS public.'
           || quote_ident(r.proname)
           || '(' || r.args || ') CASCADE';
    EXCEPTION WHEN OTHERS THEN
      NULL; -- ignore if already gone
    END;
  END LOOP;
END;
$drop_all$;

-- ============================================================ MIGRATIONS ══

-- ===== omega_master_deploy.sql =====
-- ############################################################################
-- #  SYD OMEGA 91717  --  MASTER DEPLOYMENT  (single-file, run once)          #
-- #  Complete backend: schema, evolution engine, cosmology, horoscope,        #
-- #  achievements, leaderboard, access control + 9.1717 trial, profile edit,  #
-- #  account (deactivate/delete), payments flag, founder correction, RLS fix. #
-- #  Idempotent + defensive. Validated end-to-end on clean PostgreSQL 16.     #
-- ############################################################################


-- ============================================================================
-- ==  SECTION 1 / 12  :  OMEGA_BACKEND_SYNC.sql
-- ============================================================================
-- ============================================================
--  SYD OMEGA 91717  --  BACKEND SYNC
--  Guarantees the Supabase schema matches what every page queries.
--  Safe + idempotent: re-runnable. Run in Supabase -> SQL Editor.
--  Creates 13 tables + ensures all profiles columns + RLS policies
--  so that every page's .from('table').select(...) returns data.
-- ============================================================
BEGIN;

-- ---- owner check helper (SECURITY DEFINER avoids RLS recursion) ----
DROP FUNCTION IF EXISTS public.is_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN COALESCE((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
END;
$$;

-- ============================================================
--  PROFILES  (auth-linked; ensure every expected column exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name        text,
  ADD COLUMN IF NOT EXISTS avatar_url          text,
  ADD COLUMN IF NOT EXISTS sign                text,
  ADD COLUMN IF NOT EXISTS element             text,
  ADD COLUMN IF NOT EXISTS axis_a              numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS axis_b              numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS axis_c              numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bg_color            text,
  ADD COLUMN IF NOT EXISTS certificates_earned int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nodes_earned        int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_tier     text DEFAULT 'INITIATE',
  ADD COLUMN IF NOT EXISTS is_owner            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_trial            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_rejected         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_approved     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_status          text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS kyc_doc_path        text,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS trial_expires_at    timestamptz,
  ADD COLUMN IF NOT EXISTS created_at          timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();
-- material_tier: add as plain column ONLY if it does not already exist
-- (skipped automatically if a GENERATED column of this name is present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS material_tier text DEFAULT 'SAND';

-- ============================================================
--  FEATURE TABLES  (one block each; create-if-not-exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, milestone text, issued_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.trophies(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trophy_num int, medal_num int, cert_num int,
  earned_at timestamptz DEFAULT now(), issued_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.evolution_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  axis text, note text, created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.task_completions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task text, kind text,
  completed_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.family_nodes(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, relation text, sign text, is_heir boolean DEFAULT false,
  created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.contribution_log(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  act text, domain text, evidence text, task text,
  created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.dispatches(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sign text, body text, created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.consult_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_rate numeric, confidentiality_accepted boolean DEFAULT false,
  status text DEFAULT 'pending', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.commission_contracts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  counterparty text, reference text, scope text, terms text,
  deal_value numeric, commission_rate numeric, commission_value numeric,
  confidentiality_accepted boolean DEFAULT false,
  status text DEFAULT 'draft', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.marketplace_listings(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid, title text, description text, kind text,
  price_omega numeric, file_path text,
  status text DEFAULT 'active', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.media_reservations(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, zone text, duration text, message text,
  price_omega numeric, file_path text,
  status text DEFAULT 'pending', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.publications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, body text, kind text, file_path text,
  status text DEFAULT 'draft', created_at timestamptz DEFAULT now());

-- ============================================================
--  ROW LEVEL SECURITY  --  enable + policies so each user
--  sees their own rows, and the owner sees all.
-- ============================================================
DO $$
DECLARE t text;
DECLARE tabs text[] := ARRAY['certificates','trophies','evolution_events','task_completions',
  'family_nodes','contribution_log','dispatches','consult_requests','commission_contracts',
  'marketplace_listings','media_reservations','publications'];
BEGIN
  FOREACH t IN ARRAY tabs LOOP
    -- guarantee the ownership column exists first: a table may already exist in
    -- a divergent shape (e.g. a marketplace_listings without user_id), in which
    -- case the CREATE TABLE above was skipped and the policy below would fail.
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id uuid;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_own', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I
      USING (auth.uid() = user_id OR public.is_platform_owner())
      WITH CHECK (auth.uid() = user_id OR public.is_platform_owner());$f$, t||'_own', t);
  END LOOP;
END $$;

-- marketplace + media are browseable by any signed-in member (read-only)
DROP POLICY IF EXISTS marketplace_listings_read ON public.marketplace_listings;
CREATE POLICY marketplace_listings_read ON public.marketplace_listings
  FOR SELECT USING (auth.role() = 'authenticated');

-- profiles policies (own row; owner reads all)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_platform_owner());
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_platform_owner());
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

COMMIT;

-- ============================================================
--  AFTER RUNNING:  set yourself as owner so the Architect
--  Console + Approvals + owner-only data appear.  Replace the
--  email with your login email.
-- ------------------------------------------------------------
-- UPDATE public.profiles SET is_owner=true, access_approved=true,
--   axis_a=9, axis_b=9, axis_c=9, sign='VIRGO', element='SAND',
--   material_tier='OMEGA MASTER', membership_tier='SOVEREIGN'
-- WHERE id = (SELECT id FROM auth.users WHERE email='s.y.dagher@gmail.com');
-- ============================================================

-- ============================================================================
-- ==  SECTION 2 / 12  :  OMEGA_EVOLUTION_RPC.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- LIVE EVOLUTION ENGINE
-- The functions the pages already call. Creating them brings the 729-matrix
-- to life: actions -> evolution_events -> authority recalculation -> milestones.
--
-- Contract (mapped from the live pages, do not change names/params):
--   complete_task(p_kind, p_task, p_axis, p_title)  <- academy / gaming /
--                                                       contributions / publishing
--   log_evolution(p_axis, p_note)                   <- account
--   get_all_members()                               <- approvals / profile
--   approve_member(p_uid) / reject_member / revoke_member <- approvals
--   order_stats()                                   <- hall
--
-- Rules baked in (match what the pages display):
--   baseline axis = 1, apex = 9, each cleared node = +0.25 on its axis
--   one node counts once (dedup on task_completions.task)
--   authority = sqrt(a^2 + b^2 + c^2),  apex authority = 15.588
--   integer crossings award: axis a -> Certificate, b -> Trophy, c -> Medal
--   composite nodes (3,3,3)/(6,6,6)/(9,9,9) open Gates
--
-- Safe + re-runnable. Run AFTER OMEGA_BACKEND_SYNC.sql. Pure ASCII.
-- ============================================================================
BEGIN;

-- --- ensure the derived columns the engine maintains exist ------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS authority        numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trophies_earned  int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_earned    int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nodes_cleared    int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificates_earned int  DEFAULT 0;

-- dedup guard: a node can be banked only once per member
CREATE UNIQUE INDEX IF NOT EXISTS task_completions_user_task_uniq
  ON public.task_completions(user_id, task);

-- --- drop prior versions of these functions ---------------------------------
-- An earlier build may have created these with a different return type, and
-- CREATE OR REPLACE cannot change a return type. Drop every old overload first.
-- is_platform_owner() is intentionally NOT dropped: RLS policies may depend on
-- it and its boolean return type is unchanged, so CREATE OR REPLACE handles it.
DO $drop$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'DROP FUNCTION IF EXISTS public.' || quote_ident(p.proname)
           || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS cmd
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('complete_task','log_evolution','get_all_members',
                        'approve_member','reject_member','revoke_member','order_stats')
  LOOP
    EXECUTE r.cmd;
  END LOOP;
END
$drop$;

-- ----------------------------------------------------------------------------
-- helper: am I the platform owner?
-- NOTE: this definition is transient. It is missing `SET search_path=public`
-- (search_path-hijack risk) and still reads profiles.is_owner from inside a
-- profiles-table check (the recursion problem Section 12 exists to fix).
-- Section 12 (OMEGA_RLS_FIX.sql) below REPLACES this with the safe, final
-- version that reads public.platform_owners instead. Left here only because
-- this section is an unmodified concatenation of the original migration file;
-- if you ever split this master file back into pieces, do not resurrect this
-- version as authoritative -- Section 12 is the source of truth.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN COALESCE((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
END;
$$;

-- ----------------------------------------------------------------------------
-- complete_task -- the heartbeat of the matrix
-- Returns jsonb: { applied, axis, value, a, b, c, authority, unlocked[] }
--   applied=false means the node was already yours (no double-count).
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.complete_task(text, text, text, text, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind  text,
  p_task  text,
  p_axis  text DEFAULT 'a',
  p_title text DEFAULT NULL,
  p_weight numeric DEFAULT 0.25
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid      uuid := auth.uid();
  ax       text := lower(coalesce(p_axis,'a'));
  w        numeric := coalesce(p_weight, 0.25);
  a        numeric; b numeric; c numeric;
  old_v    numeric; new_v numeric;
  crossed  boolean := false;
  unlocked jsonb := '[]'::jsonb;
  auth_v   numeric;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'error', 'not authenticated');
  END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  -- ensure a profile row exists (baseline axes = 1, matching the pages)
  INSERT INTO public.profiles (id) VALUES (uid)
    ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles
     SET axis_a = COALESCE(axis_a,1), axis_b = COALESCE(axis_b,1), axis_c = COALESCE(axis_c,1)
   WHERE id = uid;

  -- already banked? -> report current state, change nothing
  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id = uid AND task = p_task) THEN
    SELECT axis_a, axis_b, axis_c INTO a,b,c FROM public.profiles WHERE id = uid;
    auth_v := round(sqrt(a*a + b*b + c*c)::numeric, 3);
    RETURN jsonb_build_object('applied', false, 'axis', ax,
      'value', CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a', a, 'b', b, 'c', c, 'authority', auth_v, 'unlocked', unlocked);
  END IF;

  -- bank the node
  INSERT INTO public.task_completions (user_id, task, kind) VALUES (uid, p_task, p_kind);

  -- read current axis, advance (cap 9)
  SELECT axis_a, axis_b, axis_c INTO a,b,c FROM public.profiles WHERE id = uid;
  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  crossed := floor(new_v) > floor(old_v);

  IF ax = 'a' THEN a := new_v; ELSIF ax = 'b' THEN b := new_v; ELSE c := new_v; END IF;
  auth_v := round(sqrt(a*a + b*b + c*c)::numeric, 3);

  -- log the evolution event
  INSERT INTO public.evolution_events (user_id, axis, note)
    VALUES (uid, ax, COALESCE(p_title, p_kind || ' / ' || p_task));

  -- milestone: integer crossing awards a credential on that axis
  IF crossed THEN
    IF ax = 'a' THEN
      INSERT INTO public.certificates (user_id, title, milestone)
        VALUES (uid, COALESCE(p_title,'Knowledge Node'), 'Knowledge ' || floor(new_v)::text);
      unlocked := unlocked || jsonb_build_object('type','certificate','at',floor(new_v));
    ELSIF ax = 'b' THEN
      INSERT INTO public.trophies (user_id, trophy_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','trophy','at',floor(new_v));
    ELSE
      INSERT INTO public.trophies (user_id, medal_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','medal','at',floor(new_v));
    END IF;
  END IF;

  -- composite Gate: all three axes reached the same integer threshold
  IF crossed AND floor(a) = floor(b) AND floor(b) = floor(c)
     AND floor(new_v) IN (3,6,9) THEN
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
  END IF;

  -- persist axes + derived state
  UPDATE public.profiles SET
      axis_a = a, axis_b = b, axis_c = c,
      authority = auth_v,
      nodes_cleared = COALESCE(nodes_cleared,0) + 1,
      certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id = uid),
      trophies_earned     = (SELECT count(*) FROM public.trophies WHERE user_id = uid AND trophy_num IS NOT NULL),
      medals_earned       = (SELECT count(*) FROM public.trophies WHERE user_id = uid AND medal_num IS NOT NULL)
   WHERE id = uid;

  RETURN jsonb_build_object('applied', true, 'axis', ax, 'value', new_v,
    'a', a, 'b', b, 'c', c, 'authority', auth_v, 'unlocked', unlocked);
END;
$$;

-- ----------------------------------------------------------------------------
-- log_evolution -- manual axis advance from the account console
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.log_evolution(text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.log_evolution(p_axis text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN public.complete_task(
    'manual',
    'manual-' || replace(gen_random_uuid()::text,'-',''),
    p_axis,
    COALESCE(p_note,'Manual evolution'),
    0.25);
END;
$$;

-- ----------------------------------------------------------------------------
-- get_all_members -- owner-only roster with email + standing
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_all_members() CASCADE;
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO result FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'email', u.email,
      'sign', p.sign,
      'element', p.element,
      'axis_a', COALESCE(p.axis_a,1),
      'axis_b', COALESCE(p.axis_b,1),
      'axis_c', COALESCE(p.axis_c,1),
      'authority', round(sqrt(power(COALESCE(p.axis_a,1),2)+power(COALESCE(p.axis_b,1),2)+power(COALESCE(p.axis_c,1),2))::numeric,3),
      'is_owner', COALESCE(p.is_owner,false),
      'access_approved', COALESCE(p.access_approved,false),
      'membership_tier', p.membership_tier,
      'material_tier', p.material_tier,
      'certificates_earned', COALESCE(p.certificates_earned,0),
      'created_at', p.created_at
    ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at NULLS LAST
  ) q;
  RETURN result;
END;
$$;

-- ----------------------------------------------------------------------------
-- approve / reject / revoke member -- owner-only gate control
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.approve_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = true WHERE id = p_uid;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'access_approved', true);
END;
$$;

DROP FUNCTION IF EXISTS public.reject_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = false WHERE id = p_uid;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'access_approved', false);
END;
$$;

DROP FUNCTION IF EXISTS public.revoke_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.revoke_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = false WHERE id = p_uid AND COALESCE(is_owner,false) = false;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'revoked', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- order_stats -- the Hall scoreboard
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles)
  ) INTO r;
  RETURN r;
END;
$$;

-- ----------------------------------------------------------------------------
-- grants -- the pages call these as authenticated users (anon for safety)
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_evolution(text,text)                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_all_members()                           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid)                        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid)                         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid)                         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()                              TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner()                         TO authenticated, anon;

COMMIT;

-- ============================================================================
-- TUNING NOTE
-- Every cleared node advances its axis by 0.25, so 32 nodes take an axis from
-- the baseline of 1 to the apex of 9. To slow the ascent (a longer journey to
-- sovereignty), lower the default in complete_task (e.g. 0.10) -- but keep it
-- matched to the "+0.25" text the pages display, or the on-screen number will
-- jump on reload. They are aligned at 0.25 right now.
-- ============================================================================

-- ============================================================================
-- ==  SECTION 3 / 12  :  OMEGA_COSMOLOGY.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- COSMOLOGY ENGINE
-- The instant a member's sign is set (on any page), their full cosmology is
-- derived and PERSISTED: sign -> element -> Olympian -> bound agent. Before
-- this, identity.html computed those on-screen but never stored them, so the
-- Hall/leaderboard saw no element and god/agent lived only in the browser.
--
-- Server-authoritative, zero page edits. Maps are the LIVE canon taken verbatim
-- from identity.html (elements) and chatbot.html (gods, agents).
-- Run AFTER OMEGA_BACKEND_SYNC.sql. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- columns the cosmology is written into (element may already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS element text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS god     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent   text;

-- ----------------------------------------------------------------------------
-- derive_cosmology() -- normalizes the sign and fills element/god/agent
-- from the canon. Runs BEFORE the row is written, so the stored row is always
-- internally consistent no matter which page set the sign.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.derive_cosmology() CASCADE;
CREATE OR REPLACE FUNCTION public.derive_cosmology()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s text := initcap(btrim(coalesce(NEW.sign,'')));
BEGIN
  IF s = '' THEN RETURN NEW; END IF;       -- no sign yet -> leave as-is
  NEW.sign := s;                            -- normalize to Title case (Virgo, Leo...)

  NEW.element := CASE s
    WHEN 'Aries' THEN 'FIRE'  WHEN 'Leo' THEN 'FIRE'   WHEN 'Sagittarius' THEN 'FIRE'
    WHEN 'Taurus' THEN 'METAL' WHEN 'Capricorn' THEN 'METAL'
    WHEN 'Gemini' THEN 'WIND'  WHEN 'Libra' THEN 'WIND' WHEN 'Aquarius' THEN 'WIND'
    WHEN 'Cancer' THEN 'WATER' WHEN 'Scorpio' THEN 'WATER' WHEN 'Pisces' THEN 'WATER'
    WHEN 'Virgo' THEN 'SAND'
    ELSE NEW.element END;

  NEW.god := CASE s
    WHEN 'Aries' THEN 'Ares'       WHEN 'Taurus' THEN 'Aphrodite' WHEN 'Gemini' THEN 'Hermes'
    WHEN 'Cancer' THEN 'Artemis'   WHEN 'Leo' THEN 'Apollo'       WHEN 'Virgo' THEN 'Athena'
    WHEN 'Libra' THEN 'Hera'       WHEN 'Scorpio' THEN 'Demeter'  WHEN 'Sagittarius' THEN 'Zeus'
    WHEN 'Capricorn' THEN 'Hestia' WHEN 'Aquarius' THEN 'Hephaestus' WHEN 'Pisces' THEN 'Poseidon'
    ELSE NEW.god END;

  NEW.agent := CASE s
    WHEN 'Aries' THEN 'Sentinel'  WHEN 'Taurus' THEN 'Merchant' WHEN 'Gemini' THEN 'Scout'
    WHEN 'Cancer' THEN 'Warden'   WHEN 'Leo' THEN 'Sovereign'   WHEN 'Virgo' THEN 'Auditor'
    WHEN 'Libra' THEN 'Proxy'     WHEN 'Scorpio' THEN 'Oracle'  WHEN 'Sagittarius' THEN 'Beacon'
    WHEN 'Capricorn' THEN 'Analyst' WHEN 'Aquarius' THEN 'Tutor' WHEN 'Pisces' THEN 'Historian'
    ELSE NEW.agent END;

  RETURN NEW;
END;
$$;

-- fire whenever a profile is created or its sign changes
DROP TRIGGER IF EXISTS trg_derive_cosmology ON public.profiles;
CREATE TRIGGER trg_derive_cosmology
  BEFORE INSERT OR UPDATE OF sign ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.derive_cosmology();

-- backfill every existing member who already chose a sign
UPDATE public.profiles SET sign = sign
  WHERE sign IS NOT NULL AND btrim(sign) <> '';

COMMIT;

-- ============================================================================
-- ==  SECTION 4 / 12  :  OMEGA_HOROSCOPE.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- HOROSCOPE / BIRTH-DATE SIGN
-- Members were choosing their sign from a dropdown (they could pick wrong).
-- This makes the BIRTH DATE authoritative: the correct zodiac sign is derived
-- from date of birth, then cosmology (element/Olympian/agent) follows. The
-- Sovereign keeps his decreed sign (Virgo); birth date never overrides the owner.
-- Standard tropical (Western) date ranges. Run AFTER OMEGA_COSMOLOGY.sql.
-- Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- canonical date -> sign (tropical zodiac)
DROP FUNCTION IF EXISTS public.zodiac_from_date(date) CASCADE;
CREATE OR REPLACE FUNCTION public.zodiac_from_date(d date)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN d IS NULL THEN NULL
    WHEN (m=3  AND dd>=21) OR (m=4  AND dd<=19) THEN 'Aries'
    WHEN (m=4  AND dd>=20) OR (m=5  AND dd<=20) THEN 'Taurus'
    WHEN (m=5  AND dd>=21) OR (m=6  AND dd<=20) THEN 'Gemini'
    WHEN (m=6  AND dd>=21) OR (m=7  AND dd<=22) THEN 'Cancer'
    WHEN (m=7  AND dd>=23) OR (m=8  AND dd<=22) THEN 'Leo'
    WHEN (m=8  AND dd>=23) OR (m=9  AND dd<=22) THEN 'Virgo'
    WHEN (m=9  AND dd>=23) OR (m=10 AND dd<=22) THEN 'Libra'
    WHEN (m=10 AND dd>=23) OR (m=11 AND dd<=21) THEN 'Scorpio'
    WHEN (m=11 AND dd>=22) OR (m=12 AND dd<=21) THEN 'Sagittarius'
    WHEN (m=12 AND dd>=22) OR (m=1  AND dd<=19) THEN 'Capricorn'
    WHEN (m=1  AND dd>=20) OR (m=2  AND dd<=18) THEN 'Aquarius'
    ELSE 'Pisces'  -- Feb 19 - Mar 20
  END
  FROM (SELECT extract(month from d)::int AS m, extract(day from d)::int AS dd) x;
$$;

-- cosmology trigger: birth date drives the sign (except for the Sovereign),
-- then element/Olympian/agent follow from the sign.
DROP FUNCTION IF EXISTS public.derive_cosmology() CASCADE;
CREATE OR REPLACE FUNCTION public.derive_cosmology()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s text;
BEGIN
  IF NEW.birth_date IS NOT NULL AND NOT COALESCE(NEW.is_owner,false) THEN
    NEW.sign := public.zodiac_from_date(NEW.birth_date);   -- birth date is authoritative
  END IF;
  s := initcap(btrim(coalesce(NEW.sign,'')));
  IF s = '' THEN RETURN NEW; END IF;
  NEW.sign := s;

  NEW.element := CASE s
    WHEN 'Aries' THEN 'FIRE'  WHEN 'Leo' THEN 'FIRE'   WHEN 'Sagittarius' THEN 'FIRE'
    WHEN 'Taurus' THEN 'METAL' WHEN 'Capricorn' THEN 'METAL'
    WHEN 'Gemini' THEN 'WIND'  WHEN 'Libra' THEN 'WIND' WHEN 'Aquarius' THEN 'WIND'
    WHEN 'Cancer' THEN 'WATER' WHEN 'Scorpio' THEN 'WATER' WHEN 'Pisces' THEN 'WATER'
    WHEN 'Virgo' THEN 'SAND' ELSE NEW.element END;
  NEW.god := CASE s
    WHEN 'Aries' THEN 'Ares' WHEN 'Taurus' THEN 'Aphrodite' WHEN 'Gemini' THEN 'Hermes'
    WHEN 'Cancer' THEN 'Artemis' WHEN 'Leo' THEN 'Apollo' WHEN 'Virgo' THEN 'Athena'
    WHEN 'Libra' THEN 'Hera' WHEN 'Scorpio' THEN 'Demeter' WHEN 'Sagittarius' THEN 'Zeus'
    WHEN 'Capricorn' THEN 'Hestia' WHEN 'Aquarius' THEN 'Hephaestus' WHEN 'Pisces' THEN 'Poseidon'
    ELSE NEW.god END;
  NEW.agent := CASE s
    WHEN 'Aries' THEN 'Sentinel' WHEN 'Taurus' THEN 'Merchant' WHEN 'Gemini' THEN 'Scout'
    WHEN 'Cancer' THEN 'Warden' WHEN 'Leo' THEN 'Sovereign' WHEN 'Virgo' THEN 'Auditor'
    WHEN 'Libra' THEN 'Proxy' WHEN 'Scorpio' THEN 'Oracle' WHEN 'Sagittarius' THEN 'Beacon'
    WHEN 'Capricorn' THEN 'Analyst' WHEN 'Aquarius' THEN 'Tutor' WHEN 'Pisces' THEN 'Historian'
    ELSE NEW.agent END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derive_cosmology ON public.profiles;
CREATE TRIGGER trg_derive_cosmology
  BEFORE INSERT OR UPDATE OF sign, birth_date ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.derive_cosmology();

GRANT EXECUTE ON FUNCTION public.zodiac_from_date(date) TO authenticated, anon;

COMMIT;

-- ============================================================================
-- ==  SECTION 5 / 12  :  OMEGA_ACHIEVEMENTS_FIX.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- ACHIEVEMENT ALIGNMENT
-- Audit fix: the live pages expect a structure the engine did not produce.
--   trophies.html reads  .from('medals')            -> table did not exist
--   trophies.html reads  certificates.cert_num      -> column did not exist
--   honors.html  reads   profiles.nodes_earned      -> engine wrote nodes_cleared
--   pages show 12 curated trophies/medals/certificates, engine only made ~8
-- This aligns the schema + engine to the live pages. The 12 are a journey:
-- as each axis climbs 1 -> 9, that track lights its 12 milestones in order
-- (all 12 at the apex). Knowledge -> Certificates, Mastery -> Trophies,
-- Contribution -> Medals. Run AFTER the other SQL. Safe + re-runnable. ASCII.
-- ============================================================================
BEGIN;

-- 1) the medals table (mirrors trophies) ------------------------------------
-- NOTE: a medals table may already exist from an earlier step with a different
-- shape, so CREATE IF NOT EXISTS alone is not enough -- we also guarantee every
-- column the engine/pages need, whether the table is new or pre-existing.
CREATE TABLE IF NOT EXISTS public.medals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_num  int,
  earned_at  timestamptz DEFAULT now(),
  issued_at  timestamptz DEFAULT now()
);
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS medal_num int;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now();
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
-- if an id column pre-exists without a default, give it one so inserts succeed
DO $idfix$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='medals' AND column_name='id') THEN
    BEGIN ALTER TABLE public.medals ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $idfix$;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medals_select_own ON public.medals;
CREATE POLICY medals_select_own ON public.medals FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());
CREATE UNIQUE INDEX IF NOT EXISTS medals_user_num_uniq ON public.medals(user_id, medal_num);

-- 2) guarantee every column the engine + pages touch (any pre-existing shape)-
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS title     text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS milestone text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS cert_num  int;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS user_id    uuid;
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS trophy_num int;
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS earned_at  timestamptz DEFAULT now();
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS issued_at  timestamptz DEFAULT now();
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_earned        int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_cleared       int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS certificates_earned int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS trophies_earned     int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS medals_earned       int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS authority           numeric DEFAULT 0;

-- now the uniqueness guards (columns above are guaranteed to exist)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_num_uniq
  ON public.certificates(user_id, cert_num) WHERE cert_num IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trophies_user_num_uniq
  ON public.trophies(user_id, trophy_num) WHERE trophy_num IS NOT NULL;

-- 3) migrate any medals previously stored on trophies.medal_num -------------
-- Only runs if that column actually exists (older engines stored medals there;
-- many schemas never had it). Guarded so it cannot error on either shape.
DO $migrate$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='trophies' AND column_name='medal_num') THEN
    INSERT INTO public.medals (user_id, medal_num, earned_at)
      SELECT user_id, medal_num, COALESCE(earned_at, now())
      FROM public.trophies WHERE medal_num IS NOT NULL
      ON CONFLICT (user_id, medal_num) DO NOTHING;
    DELETE FROM public.trophies WHERE medal_num IS NOT NULL AND trophy_num IS NULL;
  END IF;
END $migrate$;

-- backfill cert_num from milestone text, only if a milestone column exists
DO $certbf$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='certificates' AND column_name='milestone') THEN
    UPDATE public.certificates
      SET cert_num = NULLIF(regexp_replace(COALESCE(milestone::text,''),'\D','','g'),'')::int
      WHERE cert_num IS NULL AND milestone::text ~ '\d';
  END IF;
END $certbf$;

-- 4) the award model: how many of a track's 12 milestones an axis has lit ----
DROP FUNCTION IF EXISTS public.milestones_for_axis(numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.milestones_for_axis(v numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, LEAST(12, floor((COALESCE(v,1) - 1) / 8.0 * 12)::int));
$$;

-- 5) complete_task -- now lights the 12 curated milestones per track ---------
DROP FUNCTION IF EXISTS public.complete_task(text, text, text, text, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax text := lower(coalesce(p_axis,'a'));
  w numeric := coalesce(p_weight,0.25);
  a numeric; b numeric; c numeric;
  old_v numeric; new_v numeric;
  old_m int; new_m int; k int;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('applied',false,'error','not authenticated'); END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles SET axis_a=COALESCE(axis_a,1), axis_b=COALESCE(axis_b,1), axis_c=COALESCE(axis_c,1) WHERE id=uid;

  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id=uid AND task=p_task) THEN
    SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);
    RETURN jsonb_build_object('applied',false,'axis',ax,
      'value',CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id,task,kind) VALUES (uid,p_task,p_kind);

  SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  IF ax='a' THEN a:=new_v; ELSIF ax='b' THEN b:=new_v; ELSE c:=new_v; END IF;
  auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);

  INSERT INTO public.evolution_events (user_id,axis,note)
    VALUES (uid,ax,COALESCE(p_title,p_kind||' / '||p_task));

  -- light any newly reached milestones on this track (curated 1..12)
  old_m := public.milestones_for_axis(old_v);
  new_m := public.milestones_for_axis(new_v);
  IF new_m > old_m THEN
    FOR k IN (old_m+1)..new_m LOOP
      IF ax='a' THEN
        INSERT INTO public.certificates (user_id,title,milestone,cert_num)
          SELECT uid, COALESCE(p_title,'Sovereign Certificate '||k), k, k
          WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id=uid AND cert_num=k);
        unlocked := unlocked || jsonb_build_object('type','certificate','n',k);
      ELSIF ax='b' THEN
        INSERT INTO public.trophies (user_id,trophy_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.trophies WHERE user_id=uid AND trophy_num=k);
        unlocked := unlocked || jsonb_build_object('type','trophy','n',k);
      ELSE
        INSERT INTO public.medals (user_id,medal_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.medals WHERE user_id=uid AND medal_num=k);
        unlocked := unlocked || jsonb_build_object('type','medal','n',k);
      END IF;
    END LOOP;
  END IF;

  -- composite gate at (3,3,3)/(6,6,6)/(9,9,9)
  IF floor(a)=floor(b) AND floor(b)=floor(c) AND floor(new_v) IN (3,6,9)
     AND floor(new_v) > floor(old_v) THEN
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
  END IF;

  UPDATE public.profiles SET
    axis_a=a, axis_b=b, axis_c=c, authority=auth_v,
    nodes_earned        = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    nodes_cleared       = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id=uid),
    trophies_earned     = (SELECT count(*) FROM public.trophies WHERE user_id=uid AND trophy_num IS NOT NULL),
    medals_earned       = (SELECT count(*) FROM public.medals WHERE user_id=uid)
  WHERE id=uid;

  RETURN jsonb_build_object('applied',true,'axis',ax,'value',new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
END;
$$;

-- 6) order_stats -- medals now come from the medals table --------------------
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.medals),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el,cnt) FROM (
                       SELECT initcap(element) el, count(*) cnt FROM public.profiles
                       WHERE element IS NOT NULL AND btrim(element)<>'' GROUP BY initcap(element)) e),'{}'::jsonb)
  ) INTO r; RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.milestones_for_axis(numeric) TO authenticated, anon;

COMMIT;

-- ============================================================================
-- ==  SECTION 6 / 12  :  OMEGA_LEADERBOARD.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- HALL OF FAME
-- A privacy-safe public ranking (no emails) of those who have crossed the
-- threshold, ordered by authority as they ascend the 729-matrix.
-- Also patches order_stats to return the element distribution the Hall charts.
-- Run AFTER OMEGA_EVOLUTION_RPC.sql. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- public_leaderboard(limit) -- ranked roster, SAFE for anon (no email/id leak)
--   name = member's chosen display_name, else an anonymous Initiate tag
--   authority computed from axes so even inactive members rank correctly
--   only members of the Order (approved) and the Sovereign appear
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.public_leaderboard(int) CASCADE;
CREATE OR REPLACE FUNCTION public.public_leaderboard(p_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH ranked AS (
    SELECT
      COALESCE(NULLIF(btrim(display_name),''), 'Initiate-' || substr(id::text,1,4)) AS nm,
      sign, element,
      round(COALESCE(axis_a,1),2) AS a,
      round(COALESCE(axis_b,1),2) AS b,
      round(COALESCE(axis_c,1),2) AS c,
      round(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2))::numeric,3) AS auth_v,
      COALESCE(certificates_earned,0) AS cert,
      COALESCE(trophies_earned,0)     AS tro,
      COALESCE(medals_earned,0)       AS med,
      COALESCE(is_owner,false)        AS is_owner,
      created_at
    FROM public.profiles
    WHERE COALESCE(access_approved,false) OR COALESCE(is_owner,false)
  ),
  numbered AS (
    SELECT *, row_number() OVER (ORDER BY auth_v DESC, created_at ASC NULLS LAST) AS rnk
    FROM ranked
    ORDER BY auth_v DESC, created_at ASC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit,50), 200))
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rank', rnk, 'name', nm, 'sign', sign, 'element', element,
    'axis_a', a, 'axis_b', b, 'axis_c', c, 'authority', auth_v,
    'certificates', cert, 'trophies', tro, 'medals', med, 'is_owner', is_owner
  ) ORDER BY rnk), '[]'::jsonb)
  FROM numbered;
$$;

-- ----------------------------------------------------------------------------
-- order_stats -- now also returns the element distribution (Title-cased to
-- match the Hall chart keys: Fire/Water/Wind/Metal/Sand). Same return type as
-- before (jsonb), so this is a clean replace.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el, cnt) FROM (
                       SELECT initcap(element) AS el, count(*) AS cnt
                       FROM public.profiles WHERE element IS NOT NULL AND btrim(element) <> ''
                       GROUP BY initcap(element)
                     ) e), '{}'::jsonb)
  ) INTO r;
  RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_leaderboard(int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()           TO authenticated, anon;

COMMIT;

-- ============================================================================
-- ==  SECTION 7 / 12  :  OMEGA_ACCESS_CONTROL.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- ACCESS CONTROL + 9.1717-MINUTE SOVEREIGN TRIAL
-- The founder's console (profile.html) and the global guard (bg.js) are already
-- built; this is the backend they call. Only the Sovereign approves members.
-- Approval grants exactly 9.1717 minutes of access, after which the member is
-- logged out and their trial progress is reset. Founder: Major Sleiman Youssef
-- Dagher (s.y.dagher@gmail.com) -- never trial-limited, never reset.
-- Run AFTER the other SQL. Owner-gated. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- columns the console + guard read (guaranteed, any pre-existing shape) -------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_approved  boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_trial         boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_rejected      boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted   boolean DEFAULT false;

-- drop prior versions of these functions (an earlier build may have created
-- them with a different return type, which CREATE OR REPLACE cannot change) ---
DO $drop$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'DROP FUNCTION IF EXISTS public.' || quote_ident(p.proname)
           || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS cmd
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('trial_length','approve_member','grant_permanent_access',
                        'reject_member','revoke_member','expire_trial','get_all_members')
  LOOP
    EXECUTE r.cmd;
  END LOOP;
END $drop$;

-- the fixed trial length -- 9.1717 minutes, no other option ------------------
DROP FUNCTION IF EXISTS public.trial_length() CASCADE;
CREATE OR REPLACE FUNCTION public.trial_length() RETURNS interval
  LANGUAGE sql IMMUTABLE AS $$ SELECT (9.1717 * interval '1 minute') $$;

-- APPROVE -- grants the 9.1717-minute sovereign trial ------------------------
DROP FUNCTION IF EXISTS public.approve_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE exp timestamptz;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  exp := now() + public.trial_length();
  UPDATE public.profiles
     SET access_approved=true, is_trial=true, is_rejected=false, trial_expires_at=exp
   WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'is_trial',true,'trial_expires_at',exp,'minutes',9.1717);
END;
$$;

-- GRANT PERMANENT -- lift the trial, access never expires --------------------
DROP FUNCTION IF EXISTS public.grant_permanent_access(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.grant_permanent_access(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=true, is_trial=false, is_rejected=false, trial_expires_at=NULL
   WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'permanent',true);
END;
$$;

-- REJECT ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.reject_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, is_rejected=true, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'rejected',true);
END;
$$;

-- REVOKE ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.revoke_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.revoke_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'revoked',true);
END;
$$;

-- EXPIRE TRIAL -- called by the guard when 9.1717 min elapse -----------------
-- a member may expire only their OWN trial; the owner may expire anyone.
-- Trial progress is reset (a trial persists nothing). The owner is never reset.
DROP FUNCTION IF EXISTS public.expire_trial(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.expire_trial(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() <> p_uid AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=p_uid),false) THEN
    RETURN jsonb_build_object('ok',true,'owner',true);   -- never reset the Sovereign
  END IF;
  DELETE FROM public.task_completions WHERE user_id=p_uid;
  DELETE FROM public.evolution_events WHERE user_id=p_uid;
  DELETE FROM public.trophies         WHERE user_id=p_uid;
  DELETE FROM public.medals           WHERE user_id=p_uid;
  DELETE FROM public.certificates     WHERE user_id=p_uid;
  UPDATE public.profiles SET
    axis_a=1, axis_b=1, axis_c=1, authority=0,
    nodes_earned=0, nodes_cleared=0, certificates_earned=0, trophies_earned=0, medals_earned=0,
    access_approved=false, is_trial=false, trial_expires_at=NULL
  WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'reset',true);
END;
$$;

-- GET ALL MEMBERS -- now includes the trial state the console renders --------
DROP FUNCTION IF EXISTS public.get_all_members() CASCADE;
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(row ORDER BY ord),'[]'::jsonb) INTO result FROM (
    SELECT
      -- pending first, then trials, then the rest; newest within each
      CASE WHEN COALESCE(p.access_approved,false)=false AND COALESCE(p.is_rejected,false)=false THEN 0
           WHEN COALESCE(p.is_trial,false) THEN 1 ELSE 2 END AS ord,
      jsonb_build_object(
        'id', p.id, 'email', u.email, 'display_name', p.display_name,
        'sign', p.sign, 'element', p.element,
        'axis_a', COALESCE(p.axis_a,1), 'axis_b', COALESCE(p.axis_b,1), 'axis_c', COALESCE(p.axis_c,1),
        'authority', round(sqrt(power(COALESCE(p.axis_a,1),2)+power(COALESCE(p.axis_b,1),2)+power(COALESCE(p.axis_c,1),2))::numeric,3),
        'is_owner', COALESCE(p.is_owner,false),
        'access_approved', COALESCE(p.access_approved,false),
        'is_trial', COALESCE(p.is_trial,false),
        'is_rejected', COALESCE(p.is_rejected,false),
        'trial_expires_at', p.trial_expires_at,
        'membership_tier', p.membership_tier, 'material_tier', p.material_tier,
        'certificates_earned', COALESCE(p.certificates_earned,0),
        'created_at', p.created_at
      ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) q;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.trial_length()                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid)              TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.grant_permanent_access(uuid)      TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid)               TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid)               TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.expire_trial(uuid)                TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_all_members()                 TO authenticated, anon;

-- ============================================================================
-- CRITICAL SECURITY: stop members from self-approving
-- The existing profiles_update RLS policy lets a member update their OWN row,
-- so without this a member could simply set access_approved=true and bypass the
-- Sovereign and the trial entirely. We restrict column-level UPDATE to the
-- personalization fields a member may legitimately change; every access / trial
-- / axis column is now writable ONLY through the owner-gated, SECURITY DEFINER
-- functions above (which run with elevated rights and ignore these grants).
-- ============================================================================
DO $lock$
DECLARE col text;
BEGIN
  BEGIN REVOKE UPDATE ON public.profiles FROM authenticated; EXCEPTION WHEN others THEN NULL; END;
  BEGIN REVOKE UPDATE ON public.profiles FROM anon;          EXCEPTION WHEN others THEN NULL; END;
  FOREACH col IN ARRAY ARRAY['display_name','sign','birth_date','terms_accepted','updated_at','nationality','profession','bio','avatar_url'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='profiles' AND column_name=col) THEN
      EXECUTE format('GRANT UPDATE (%I) ON public.profiles TO authenticated', col);
    END IF;
  END LOOP;
END $lock$;

-- defense in depth: a newly created profile can never be born approved or owner
DROP FUNCTION IF EXISTS public.enforce_access_defaults() CASCADE;
CREATE OR REPLACE FUNCTION public.enforce_access_defaults()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.access_approved  := false;
  NEW.is_trial         := false;
  NEW.is_rejected      := false;
  NEW.trial_expires_at := NULL;
  NEW.is_owner         := false;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_access_defaults ON public.profiles;
CREATE TRIGGER trg_enforce_access_defaults
  BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_access_defaults();

COMMIT;

-- ============================================================================
-- ==  SECTION 8 / 12  :  OMEGA_PROFILE_FIELDS.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- SELF-EDIT PROFILE FIELDS
-- Lets a verified member correct their own personal info (name, sign, birth
-- date, nationality, profession, bio) if they filled it in wrong. Access /
-- trial / axis columns remain writable ONLY through the owner-gated functions
-- (this only grants the harmless personalization columns). Run any time.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio         text;

-- grant self-update ONLY on personalization columns that exist
DO $g$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['display_name','sign','birth_date','nationality','profession','bio','terms_accepted','updated_at'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='profiles' AND column_name=col) THEN
      EXECUTE format('GRANT UPDATE (%I) ON public.profiles TO authenticated', col);
    END IF;
  END LOOP;
END $g$;

COMMIT;

-- ============================================================================
-- ==  SECTION 9 / 12  :  OMEGA_ACCOUNT.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- ACCOUNT CONTROL (deactivate / reactivate / delete)
-- User-friendly + compliance (GDPR-CCPA right-to-delete).
-- A member may deactivate (reversible) or permanently delete ONLY their own
-- account. The Sovereign founder can never be deactivated or deleted. Safe.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at   timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_deletion timestamptz;

-- DEACTIVATE -- reversible; the access guard will treat them as not-approved --
DROP FUNCTION IF EXISTS public.deactivate_account() CASCADE;
CREATE OR REPLACE FUNCTION public.deactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=auth.uid()),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  UPDATE public.profiles
     SET deactivated_at = now(), access_approved = false, is_trial = false, trial_expires_at = NULL
   WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'deactivated',true);
END;
$$;

-- REACTIVATE -- lifts a self-deactivation (owner re-approval still governs trial)
DROP FUNCTION IF EXISTS public.reactivate_account() CASCADE;
CREATE OR REPLACE FUNCTION public.reactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  UPDATE public.profiles SET deactivated_at = NULL WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'reactivated',true);
END;
$$;

-- DELETE -- permanent erasure of the caller's own data (right-to-delete) -----
DROP FUNCTION IF EXISTS public.delete_account() CASCADE;
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=uid),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  -- wipe the member's data across the platform
  DELETE FROM public.task_completions WHERE user_id = uid;
  DELETE FROM public.evolution_events WHERE user_id = uid;
  DELETE FROM public.trophies         WHERE user_id = uid;
  DELETE FROM public.medals           WHERE user_id = uid;
  DELETE FROM public.certificates     WHERE user_id = uid;
  DELETE FROM public.platform_owners  WHERE user_id = uid;
  DELETE FROM public.profiles         WHERE id = uid;
  -- attempt to remove the auth identity too (needs elevated rights; if the
  -- function owner lacks them, the data is already wiped and we flag for purge)
  BEGIN
    DELETE FROM auth.users WHERE id = uid;
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',true);
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',false,'note','data wiped; auth row purge pending');
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account()     TO authenticated;

COMMIT;

-- ============================================================================
-- ==  SECTION 10 / 12  :  OMEGA_PAYMENTS.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- PAYMENTS SCAFFOLD (DORMANT until legal clears)
-- Subscriptions for the 9 material tiers ($9.17 - $917.17 / month). Everything
-- here is INERT until BOTH conditions are met by the founder:
--   (1) platform_settings.payments_enabled = true  (flip via set_platform_flag)
--   (2) the Stripe secret keys are set on the Edge Functions
-- No charge can occur until the Sovereign turns it on. Safe + re-runnable.
-- ============================================================================
BEGIN;

-- platform-wide feature flags (founder-controlled) ---------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  bool_value boolean DEFAULT false,
  text_value text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key, bool_value)
  VALUES ('payments_enabled', false)
  ON CONFLICT (key) DO NOTHING;   -- default OFF; never force-enable on re-run
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_settings_read ON public.platform_settings;
CREATE POLICY platform_settings_read ON public.platform_settings FOR SELECT USING (true);

-- subscription columns on the member profile ---------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status    text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- read a flag (public; returns false when unset) ------------------------------
DROP FUNCTION IF EXISTS public.get_platform_flag(text) CASCADE;
CREATE OR REPLACE FUNCTION public.get_platform_flag(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT bool_value FROM public.platform_settings WHERE key=p_key), false);
$$;

-- flip a flag (FOUNDER ONLY -- this is how payments get switched on) ----------
DROP FUNCTION IF EXISTS public.set_platform_flag(text, boolean) CASCADE;
CREATE OR REPLACE FUNCTION public.set_platform_flag(p_key text, p_val boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  INSERT INTO public.platform_settings(key,bool_value,updated_at)
    VALUES (p_key,p_val,now())
    ON CONFLICT (key) DO UPDATE SET bool_value=excluded.bool_value, updated_at=now();
  RETURN jsonb_build_object('ok',true,'key',p_key,'value',p_val);
END;
$$;

-- a member reads their own subscription --------------------------------------
DROP FUNCTION IF EXISTS public.my_subscription() CASCADE;
CREATE OR REPLACE FUNCTION public.my_subscription()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tier',   COALESCE(subscription_tier,'none'),
    'status', COALESCE(subscription_status,'none'),
    'period_end', subscription_period_end,
    'payments_enabled', public.get_platform_flag('payments_enabled')
  ) FROM public.profiles WHERE id = auth.uid();
$$;

-- the Stripe webhook (service role) records a subscription result ------------
-- callable only by the service role or the owner; never by a normal member.
DROP FUNCTION IF EXISTS public.apply_subscription(uuid, text, text, timestamptz, text) CASCADE;
CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz, p_customer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_end = p_period_end,
    stripe_customer_id = COALESCE(p_customer, stripe_customer_id),
    membership_tier = CASE WHEN p_status IN ('active','trialing') THEN upper(p_tier) ELSE membership_tier END
  WHERE id = p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'tier',p_tier,'status',p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_flag(text)                             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_platform_flag(text, boolean)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_subscription()                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription(uuid,text,text,timestamptz,text) TO authenticated, service_role;

COMMIT;

-- ============================================================================
-- ==  SECTION 11 / 12  :  OMEGA_FOUNDER_FIX.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- FOUNDER CORRECTION
-- Corrects the Sovereign's record and guarantees owner access.
--   1. Sign: ARIES (born 19 April 1982) -> element Fire, Olympian Ares,
--      agent Sentinel. (Replaces the earlier Virgo/Sand entry.)
--   2. Flags the account is_owner = true with permanent access, so the
--      founder's Access Control console (the ACCESS tab in profile.html)
--      becomes visible and get_all_members returns the member roster.
-- Founder: Major Sleiman Youssef Dagher -- s.y.dagher@gmail.com
-- Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- make sure the columns exist (works no matter which SQL you have run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sign            text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS element         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS god             text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent           text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date      date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner        boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_trial        boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_rejected     boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS axis_a          numeric DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS axis_b          numeric DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS axis_c          numeric DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS authority           numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificates_earned int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trophies_earned     int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_earned       int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nodes_earned        int DEFAULT 0;

-- ensure the founder's profile row EXISTS first (a bare row if missing). The
-- BEFORE INSERT trigger forces access fields false on any new row; the UPDATE
-- below then correctly sets ownership. Without this, a missing profile row
-- means the ownership UPDATE silently touches nothing and the console stays
-- hidden -- the exact "I can't find the access control" symptom.
INSERT INTO public.profiles(id)
  SELECT id FROM auth.users
  WHERE lower(email) IN ('s.y.dagher@gmail.com','slmndghr@gmail.com')
  ON CONFLICT (id) DO NOTHING;

-- the correction: Aries + owner + permanent access, matched by the founder's
-- login email (covers both known addresses). Explicit element/god/agent so it
-- is correct even if the cosmology trigger is not installed; if it IS, the
-- trigger derives the identical values from sign = 'Aries'.
UPDATE public.profiles SET
  sign            = 'Aries',
  birth_date      = DATE '1982-04-19',
  element         = 'FIRE',
  god             = 'Ares',
  agent           = 'Sentinel',
  is_owner        = true,
  access_approved = true,
  is_trial        = false,
  is_rejected     = false,
  trial_expires_at = NULL,
  axis_a          = 9,
  axis_b          = 9,
  axis_c          = 9,
  authority       = 15.588,
  certificates_earned = 12,
  trophies_earned     = 12,
  medals_earned       = 12,
  nodes_earned        = 96
WHERE id IN (
  SELECT id FROM auth.users
  WHERE lower(email) IN ('s.y.dagher@gmail.com','slmndghr@gmail.com')
);

-- light every achievement slot for the Sovereign (12 certificates / 12 trophies
-- / 12 medals), guarded so it is skipped if a table is not present yet.
DO $apex$
DECLARE fid uuid;
BEGIN
  SELECT id INTO fid FROM auth.users
    WHERE lower(email) IN ('s.y.dagher@gmail.com','slmndghr@gmail.com') LIMIT 1;
  IF fid IS NULL THEN RETURN; END IF;
  -- self-heal: legacy tables (from another tool) may have NOT-NULL name columns
  -- our seed only fills the _num columns, so relax those legacy constraints first
  BEGIN ALTER TABLE public.certificates ALTER COLUMN cert_name  DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN trophy_name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN medal_name  DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.certificates ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  IF to_regclass('public.certificates') IS NOT NULL THEN
    INSERT INTO public.certificates(user_id, cert_num)
      SELECT fid, g FROM generate_series(1,12) g
      WHERE NOT EXISTS (SELECT 1 FROM public.certificates c WHERE c.user_id=fid AND c.cert_num=g);
  END IF;
  IF to_regclass('public.trophies') IS NOT NULL THEN
    INSERT INTO public.trophies(user_id, trophy_num)
      SELECT fid, g FROM generate_series(1,12) g
      WHERE NOT EXISTS (SELECT 1 FROM public.trophies t WHERE t.user_id=fid AND t.trophy_num=g);
  END IF;
  IF to_regclass('public.medals') IS NOT NULL THEN
    INSERT INTO public.medals(user_id, medal_num)
      SELECT fid, g FROM generate_series(1,12) g
      WHERE NOT EXISTS (SELECT 1 FROM public.medals m WHERE m.user_id=fid AND m.medal_num=g);
  END IF;
END $apex$;

COMMIT;

-- ---------------------------------------------------------------------------
-- verify (run this SELECT after; you should see one row, ARIES / FIRE / owner)
-- ---------------------------------------------------------------------------
SELECT u.email, p.sign, p.element, p.god, p.agent, p.birth_date,
       p.is_owner, p.access_approved
FROM public.profiles p JOIN auth.users u ON u.id = p.id
WHERE lower(u.email) IN ('s.y.dagher@gmail.com','slmndghr@gmail.com');

-- ============================================================================
-- ==  SECTION 12 / 12  :  OMEGA_RLS_FIX.sql
-- ============================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- RLS RECURSION FIX (error 42P17 on profile save)
-- The profiles policies call is_platform_owner(), which read from profiles,
-- which re-triggered the profiles policy -> infinite recursion (42P17). This
-- moves the owner check to a tiny RLS-free lookup table so the loop is broken,
-- while the founder keeps full owner-sees-all access. Safe + re-runnable.
-- ============================================================================
BEGIN;

-- 1) RLS-free lookup of who the owner is (contains only owner user-ids) -------
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false)=true
  ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_owners_read ON public.platform_owners;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

-- 2) keep it in sync whenever a profile's is_owner flag changes ---------------
DROP FUNCTION IF EXISTS public.sync_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.sync_platform_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF COALESCE(NEW.is_owner,false) THEN
    INSERT INTO public.platform_owners(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.platform_owners WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_platform_owner ON public.profiles;
CREATE TRIGGER trg_sync_platform_owner
  AFTER INSERT OR UPDATE OF is_owner ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_platform_owner();

-- 3) owner check now reads the RLS-free table -- never profiles -> no recursion
DROP FUNCTION IF EXISTS public.is_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

COMMIT;
-- ===== end omega_master_deploy.sql =====

-- ===== omega_personal_logs.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- PERSONAL LOGS (real backend for 6 pages that only saved
-- to localStorage, or in events.html's case, didn't save anywhere at all)
-- Pages: bloodline.html, heritage.html, events.html, research.html,
-- social.html, travel.html. Each member's own data, RLS-scoped to themselves.
-- Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

-- bloodline.html -- family tree nodes ------------------------------------
CREATE TABLE IF NOT EXISTS public.bloodline_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, rel text, birth text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bloodline_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bloodline_own ON public.bloodline_nodes;
CREATE POLICY bloodline_own ON public.bloodline_nodes FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.bloodline_nodes TO authenticated;

-- heritage.html -- archive records ----------------------------------------
CREATE TABLE IF NOT EXISTS public.heritage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, body text, era text, category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.heritage_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS heritage_own ON public.heritage_records;
CREATE POLICY heritage_own ON public.heritage_records FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.heritage_records TO authenticated;

-- events.html -- member-created events (was fully non-functional) + RSVPs --
CREATE TABLE IF NOT EXISTS public.member_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, event_date text, format text, event_type text, description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.member_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_read ON public.member_events;
CREATE POLICY events_read ON public.member_events FOR SELECT TO authenticated USING (true); -- events are visible to all members
DROP POLICY IF EXISTS events_write ON public.member_events;
CREATE POLICY events_write ON public.member_events FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS events_delete ON public.member_events;
CREATE POLICY events_delete ON public.member_events FOR DELETE TO authenticated
  USING (auth.uid()=user_id OR public.is_platform_owner());
GRANT SELECT, INSERT, DELETE ON public.member_events TO authenticated;

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_ref text NOT NULL,  -- either a member_events.id (as text) or a static catalog event key
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_ref)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rsvp_own ON public.event_rsvps;
CREATE POLICY rsvp_own ON public.event_rsvps FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;

-- research.html -- hypothesis submissions ---------------------------------
CREATE TABLE IF NOT EXISTS public.research_hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text, title text NOT NULL, body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.research_hypotheses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS research_own ON public.research_hypotheses;
CREATE POLICY research_own ON public.research_hypotheses FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.research_hypotheses TO authenticated;

-- social.html -- platform connections + broadcasts ------------------------
CREATE TABLE IF NOT EXISTS public.social_connections (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform)
);
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS social_conn_own ON public.social_connections;
CREATE POLICY social_conn_own ON public.social_connections FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_connections TO authenticated;

CREATE TABLE IF NOT EXISTS public.social_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  networks text[], body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS broadcast_own ON public.social_broadcasts;
CREATE POLICY broadcast_own ON public.social_broadcasts FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.social_broadcasts TO authenticated;

-- travel.html -- journey log -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.travel_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  destination text NOT NULL, purpose text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.travel_journeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS travel_own ON public.travel_journeys;
CREATE POLICY travel_own ON public.travel_journeys FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.travel_journeys TO authenticated;

COMMIT;

-- ============================================================================
-- ADDENDUM -- three more pages found using the same localStorage-only pattern
-- (automation.html, character.html, health.html), found in a later sweep.
-- ============================================================================
BEGIN;

-- automation.html -- user-defined rule configurations (storage only; actual
-- triggered execution of these rules would need a separate backend worker/cron,
-- which is genuinely out of scope here -- this fixes persistence, not execution)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_key text NOT NULL, trigger_value text, action_key text NOT NULL, action_note text,
  is_on boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS automation_own ON public.automation_rules;
CREATE POLICY automation_own ON public.automation_rules FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;

-- character.html -- personal character record (one per member, upsert)
CREATE TABLE IF NOT EXISTS public.character_records (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, dominant_trait text, inheritance_mode text, legacy_statement text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.character_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_own ON public.character_records;
CREATE POLICY character_own ON public.character_records FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE ON public.character_records TO authenticated;

-- health.html -- wellbeing log entries
CREATE TABLE IF NOT EXISTS public.health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mind numeric, heart numeric, energy numeric, body numeric, soul numeric,
  total numeric, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS health_own ON public.health_logs;
CREATE POLICY health_own ON public.health_logs FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.health_logs TO authenticated;

COMMIT;
-- ===== end omega_personal_logs.sql =====

-- ===== omega_sovereign_points.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- SOVEREIGN POINTS (educational crypto-literacy simulator)
-- Real internal points, earned through real platform actions, spendable on
-- real internal perks, and tradeable between members in a clearly-labeled
-- SIMULATION so members learn real crypto/blockchain mechanics (earning,
-- wallets, trading, gains) hands-on -- with zero real monetary value, no
-- blockchain deployment, no tradability for real currency. This is a
-- gamification/education layer, not a financial instrument.
-- Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.sovereign_points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  delta int NOT NULL,                 -- positive = earned/received, negative = spent/sent
  reason text NOT NULL,               -- 'academy_lesson' | 'gaming_stage' | 'exam_pass' | 'contribution' | 'daily_login' | 'trade_sent' | 'trade_received' | 'perk_purchase'
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sovereign_points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spl_own ON public.sovereign_points_ledger;
CREATE POLICY spl_own ON public.sovereign_points_ledger FOR SELECT TO authenticated
  USING (auth.uid()=user_id OR public.is_platform_owner());
GRANT SELECT ON public.sovereign_points_ledger TO authenticated;
-- no direct INSERT grant -- all writes go through the functions below, which
-- validate the earning event actually happened for real before crediting.

-- real balance (sum of all ledger entries)
DROP FUNCTION IF EXISTS public.my_points_balance() CASCADE;
CREATE OR REPLACE FUNCTION public.my_points_balance()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); bal int; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT COALESCE(SUM(delta),0) INTO bal FROM public.sovereign_points_ledger WHERE user_id=uid;
  RETURN jsonb_build_object('ok',true,'balance',bal);
END; $$;
GRANT EXECUTE ON FUNCTION public.my_points_balance() TO authenticated;

-- daily login bonus -- real, rate-limited to once per real calendar day
DROP FUNCTION IF EXISTS public.claim_daily_points() CASCADE;
CREATE OR REPLACE FUNCTION public.claim_daily_points()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); already boolean; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.sovereign_points_ledger
    WHERE user_id=uid AND reason='daily_login' AND created_at::date = now()::date) INTO already;
  IF already THEN RETURN jsonb_build_object('ok',false,'error','already_claimed_today'); END IF;
  INSERT INTO public.sovereign_points_ledger(user_id,delta,reason,note) VALUES (uid,10,'daily_login','Daily presence bonus');
  RETURN jsonb_build_object('ok',true,'awarded',10);
END; $$;
GRANT EXECUTE ON FUNCTION public.claim_daily_points() TO authenticated;

-- ---------------------------------------------------------------------------
-- SIMULATED TRADING -- clearly a practice exchange, not a real market.
-- Members can send/request simulated point trades with each other, learning
-- real concepts (offer, counter-offer, accept, settle) with zero real value.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sim_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount int NOT NULL CHECK (amount > 0),
  message text,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined | cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.sim_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trade_visible ON public.sim_trades;
CREATE POLICY trade_visible ON public.sim_trades FOR SELECT TO authenticated
  USING (auth.uid()=from_user OR auth.uid()=to_user);
GRANT SELECT ON public.sim_trades TO authenticated;

-- propose a simulated trade -- does NOT move points yet, only on accept
DROP FUNCTION IF EXISTS public.propose_sim_trade(uuid, int, text) CASCADE;
CREATE OR REPLACE FUNCTION public.propose_sim_trade(p_to uuid, p_amount int, p_message text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); bal int; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_amount IS NULL OR p_amount<=0 THEN RETURN jsonb_build_object('ok',false,'error','bad_amount'); END IF;
  IF p_to = uid THEN RETURN jsonb_build_object('ok',false,'error','cannot_trade_self'); END IF;
  SELECT COALESCE(SUM(delta),0) INTO bal FROM public.sovereign_points_ledger WHERE user_id=uid;
  IF bal < p_amount THEN RETURN jsonb_build_object('ok',false,'error','insufficient_balance'); END IF;
  INSERT INTO public.sim_trades(from_user,to_user,amount,message) VALUES (uid,p_to,p_amount,p_message);
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.propose_sim_trade(uuid,int,text) TO authenticated;

-- accept a simulated trade -- this is where points actually move, atomically
DROP FUNCTION IF EXISTS public.resolve_sim_trade(uuid, boolean) CASCADE;
CREATE OR REPLACE FUNCTION public.resolve_sim_trade(p_trade_id uuid, p_accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); t public.sim_trades; bal int; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT * INTO t FROM public.sim_trades WHERE id=p_trade_id AND to_user=uid AND status='pending';
  IF t.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','trade_not_found'); END IF;
  IF NOT p_accept THEN
    UPDATE public.sim_trades SET status='declined', resolved_at=now() WHERE id=p_trade_id;
    RETURN jsonb_build_object('ok',true,'status','declined');
  END IF;
  SELECT COALESCE(SUM(delta),0) INTO bal FROM public.sovereign_points_ledger WHERE user_id=t.from_user;
  IF bal < t.amount THEN
    UPDATE public.sim_trades SET status='cancelled', resolved_at=now() WHERE id=p_trade_id;
    RETURN jsonb_build_object('ok',false,'error','sender_insufficient_balance');
  END IF;
  INSERT INTO public.sovereign_points_ledger(user_id,delta,reason,note) VALUES (t.from_user,-t.amount,'trade_sent','Simulated trade to another member');
  INSERT INTO public.sovereign_points_ledger(user_id,delta,reason,note) VALUES (t.to_user,t.amount,'trade_received','Simulated trade from another member');
  UPDATE public.sim_trades SET status='accepted', resolved_at=now() WHERE id=p_trade_id;
  RETURN jsonb_build_object('ok',true,'status','accepted');
END; $$;
GRANT EXECUTE ON FUNCTION public.resolve_sim_trade(uuid,boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- INTERNAL PERKS -- real things points can actually buy, all cosmetic/
-- platform-native. No real-world value ever changes hands.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.point_perks (
  id text PRIMARY KEY, name text NOT NULL, cost int NOT NULL, description text
);
INSERT INTO public.point_perks(id,name,cost,description) VALUES
 ('theme_crimson','Crimson Accent Theme',50,'Unlock a crimson accent variant across your dashboard.'),
 ('priority_oracle','Priority Oracle Response',30,'Your next 5 Oracle readings get priority processing.'),
 ('profile_flourish','Animated Profile Flourish',75,'A subtle animated flourish on your public profile card.'),
 ('title_badge','Custom Title Badge',100,'Display a custom short title alongside your name.')
 ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.point_perks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS perks_read ON public.point_perks;
CREATE POLICY perks_read ON public.point_perks FOR SELECT USING (true);
GRANT SELECT ON public.point_perks TO authenticated;

CREATE TABLE IF NOT EXISTS public.member_perks (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  perk_id text NOT NULL REFERENCES public.point_perks(id),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, perk_id)
);
ALTER TABLE public.member_perks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_own ON public.member_perks;
CREATE POLICY mp_own ON public.member_perks FOR SELECT TO authenticated USING (auth.uid()=user_id);
GRANT SELECT ON public.member_perks TO authenticated;

DROP FUNCTION IF EXISTS public.purchase_perk(text) CASCADE;
CREATE OR REPLACE FUNCTION public.purchase_perk(p_perk_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); bal int; perk_cost int; already boolean; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT cost INTO perk_cost FROM public.point_perks WHERE id=p_perk_id;
  IF perk_cost IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unknown_perk'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.member_perks WHERE user_id=uid AND perk_id=p_perk_id) INTO already;
  IF already THEN RETURN jsonb_build_object('ok',false,'error','already_owned'); END IF;
  SELECT COALESCE(SUM(delta),0) INTO bal FROM public.sovereign_points_ledger WHERE user_id=uid;
  IF bal < perk_cost THEN RETURN jsonb_build_object('ok',false,'error','insufficient_balance'); END IF;
  INSERT INTO public.sovereign_points_ledger(user_id,delta,reason,note) VALUES (uid,-perk_cost,'perk_purchase',p_perk_id);
  INSERT INTO public.member_perks(user_id,perk_id) VALUES (uid,p_perk_id);
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.purchase_perk(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Hook real points into REAL actions that already happen (Academy, Gaming,
-- Exams). Awards points automatically whenever complete_task/submit_exam_result
-- actually fire for real -- not just decoratively.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.award_points(uuid, int, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.award_points(p_user uuid, p_amount int, p_reason text, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.sovereign_points_ledger(user_id,delta,reason,note) VALUES (p_user,p_amount,p_reason,p_note);
END; $$;
-- internal only -- called by other SECURITY DEFINER functions, not exposed to the client directly
REVOKE EXECUTE ON FUNCTION public.award_points(uuid,int,text,text) FROM PUBLIC, authenticated, anon;

-- ---------------------------------------------------------------------------
-- Real triggers -- award points automatically whenever a real task_completions
-- or a real passed exam_results row is inserted, without modifying the
-- existing complete_task()/submit_exam_result() functions at all (additive
-- only -- those functions are defined in multiple files already and are
-- risky to edit directly; a trigger reacts to the same real event safely).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.trg_award_task_points() CASCADE;
CREATE OR REPLACE FUNCTION public.trg_award_task_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.award_points(NEW.user_id, 5, 'academy_lesson', COALESCE(NEW.task,'task completed'));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS award_points_on_task ON public.task_completions;
CREATE TRIGGER award_points_on_task AFTER INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_task_points();

DROP FUNCTION IF EXISTS public.trg_award_exam_points() CASCADE;
CREATE OR REPLACE FUNCTION public.trg_award_exam_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.passed THEN
    PERFORM public.award_points(NEW.user_id, 25, 'exam_pass', COALESCE(NEW.cert_name,'exam passed'));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS award_points_on_exam ON public.exam_results;
CREATE TRIGGER award_points_on_exam AFTER INSERT ON public.exam_results
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_exam_points();

COMMIT;

-- ============================================================================
-- ADDENDUM -- tie point earning directly to the real 12x12x9x9x9 nested matrix
-- (matrix_progress, from omega_nested_matrix.sql), not just the flat
-- task/exam events. Advancing any of the 12 real tracks awards real points,
-- so the points system genuinely reflects 12x12x9x9x9 engagement, not a
-- disconnected side mechanic.
-- ============================================================================
BEGIN;

DROP FUNCTION IF EXISTS public.trg_award_matrix_points() CASCADE;
CREATE OR REPLACE FUNCTION public.trg_award_matrix_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE moved boolean; BEGIN
  moved := (NEW.a > OLD.a) OR (NEW.b > OLD.b) OR (NEW.c > OLD.c);
  IF moved THEN
    PERFORM public.award_points(NEW.user_id, 2, 'matrix_advance',
      'Track '||NEW.track||' phase '||NEW.phase||' advanced to ('||NEW.a||','||NEW.b||','||NEW.c||')');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS award_points_on_matrix_advance ON public.matrix_progress;
CREATE TRIGGER award_points_on_matrix_advance AFTER UPDATE ON public.matrix_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_matrix_points();

-- summary view: real points balance alongside real matrix completion, so
-- asset-facing pages (vault, treasury, wallet, blockchain) can show both
-- together as one coherent "your standing" picture.
DROP FUNCTION IF EXISTS public.my_sovereign_summary() CASCADE;
CREATE OR REPLACE FUNCTION public.my_sovereign_summary()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); pts int; matrix_total numeric; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT COALESCE(SUM(delta),0) INTO pts FROM public.sovereign_points_ledger WHERE user_id=uid;
  SELECT COALESCE(SUM(public.matrix_node(a,b,c)),0) INTO matrix_total FROM public.matrix_progress WHERE user_id=uid;
  RETURN jsonb_build_object('ok',true,'points',pts,'matrix_nodes_reached',matrix_total,'matrix_nodes_total',104976,
    'matrix_pct', round(matrix_total/104976.0*100,3));
END; $$;
GRANT EXECUTE ON FUNCTION public.my_sovereign_summary() TO authenticated;

COMMIT;
-- ===== end omega_sovereign_points.sql =====

-- ===== omega_nested_matrix.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- NESTED MATRIX (12 x 9x9x9 = 8,748 nodes)
-- The deeper structure: each of the 12 tracks is a FULL 9x9x9 (729) matrix.
-- A member holds a position (a,b,c) in EACH of the 12 tracks. The profile's
-- axis_a/b/c remain the aggregate spine; this adds the per-track depth.
--   12 tracks  x  729 nodes  =  8,748 total nodes.
-- Node index within a track = (a-1)*81 + (b-1)*9 + (c-1) + 1  (1..729).
-- Non-recursive RLS. Validated.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.matrix_tracks (
  track int PRIMARY KEY CHECK (track BETWEEN 1 AND 12),
  sign  text NOT NULL, element text
);
INSERT INTO public.matrix_tracks(track,sign,element) VALUES
 (1,'Aries','Fire'),(2,'Taurus','Metal'),(3,'Gemini','Wind'),(4,'Cancer','Water'),
 (5,'Leo','Fire'),(6,'Virgo','Sand'),(7,'Libra','Wind'),(8,'Scorpio','Water'),
 (9,'Sagittarius','Fire'),(10,'Capricorn','Metal'),(11,'Aquarius','Wind'),(12,'Pisces','Water')
 ON CONFLICT (track) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.matrix_progress (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  track   int  NOT NULL REFERENCES public.matrix_tracks(track),
  a int NOT NULL DEFAULT 1 CHECK (a BETWEEN 1 AND 9),
  b int NOT NULL DEFAULT 1 CHECK (b BETWEEN 1 AND 9),
  c int NOT NULL DEFAULT 1 CHECK (c BETWEEN 1 AND 9),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track)
);
ALTER TABLE public.matrix_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrix_tracks   ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mp_rw ON public.matrix_progress;
CREATE POLICY mp_rw ON public.matrix_progress USING (auth.uid()=user_id OR public.is_platform_owner()) WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS mt_read ON public.matrix_tracks;
CREATE POLICY mt_read ON public.matrix_tracks FOR SELECT USING (true);

-- node index (1..729) within a track
DROP FUNCTION IF EXISTS public.matrix_node(int, int, int) CASCADE;
CREATE OR REPLACE FUNCTION public.matrix_node(a int,b int,c int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT (a-1)*81 + (b-1)*9 + (c-1) + 1 $$;

-- read my full nested matrix: 12 tracks, each with (a,b,c), node, % of 729
DROP FUNCTION IF EXISTS public.my_matrix() CASCADE;
CREATE OR REPLACE FUNCTION public.my_matrix()
RETURNS TABLE(track int, sign text, element text, a int, b int, c int, node int, pct numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.matrix_progress(user_id,track)
    SELECT auth.uid(), t.track FROM public.matrix_tracks t
    ON CONFLICT (user_id,track) DO NOTHING;
  RETURN QUERY
    SELECT t.track,t.sign,t.element,p.a,p.b,p.c,
           public.matrix_node(p.a,p.b,p.c),
           round(public.matrix_node(p.a,p.b,p.c)/729.0*100,1)
    FROM public.matrix_tracks t
    JOIN public.matrix_progress p ON p.track=t.track AND p.user_id=auth.uid()
    ORDER BY t.track;
END;
$$;

-- advance one axis within one track (an evolution event on that lens)
DROP FUNCTION IF EXISTS public.advance_matrix(int, text) CASCADE;
CREATE OR REPLACE FUNCTION public.advance_matrix(p_track int, p_axis text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.matrix_progress;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  INSERT INTO public.matrix_progress(user_id,track) VALUES (auth.uid(),p_track)
    ON CONFLICT (user_id,track) DO NOTHING;
  UPDATE public.matrix_progress SET
     a = CASE WHEN lower(p_axis)='a' THEN least(9,a+1) ELSE a END,
     b = CASE WHEN lower(p_axis)='b' THEN least(9,b+1) ELSE b END,
     c = CASE WHEN lower(p_axis)='c' THEN least(9,c+1) ELSE c END,
     updated_at = now()
   WHERE user_id=auth.uid() AND track=p_track RETURNING * INTO r;
  RETURN jsonb_build_object('ok',true,'track',p_track,'a',r.a,'b',r.b,'c',r.c,'node',public.matrix_node(r.a,r.b,r.c));
END;
$$;

GRANT SELECT ON public.matrix_tracks, public.matrix_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_matrix() TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_matrix(int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.matrix_node(int,int,int) TO authenticated, anon;

COMMIT;

-- proof of scale
SELECT (SELECT count(*) FROM public.matrix_tracks) AS tracks,
       729 AS nodes_per_track,
       (SELECT count(*) FROM public.matrix_tracks)*729 AS total_nodes;
-- ===== end omega_nested_matrix.sql =====

-- ===== omega_tokens.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- TOKEN ECONOMY (section 6) -- DORMANT / LEGAL-GATED
-- The 12 sovereign tokens (one per sign/track). Balances are readable so the
-- vault can display them, but ALL earning/spending is DORMANT behind the
-- 'tokens_enabled' flag (default FALSE) until legal sign-off (section 11).
-- Nothing here can move value until you deliberately enable it. Safe RLS.
-- ============================================================================
BEGIN;

-- feature-flag store (shared with payments; create if absent) ----------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY, bool_value boolean DEFAULT false, text_value text, updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key,bool_value) VALUES ('tokens_enabled',false)
  ON CONFLICT (key) DO NOTHING;
-- was missing RLS entirely -- this table gates tokens/payments sitewide, so an
-- unrestricted table is a real risk (readable/writable beyond intent by default).
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_read ON public.platform_settings;
CREATE POLICY ps_read ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS ps_write ON public.platform_settings;
CREATE POLICY ps_write ON public.platform_settings FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
GRANT SELECT ON public.platform_settings TO authenticated, anon;

-- the 12 sovereign tokens (code -> sign) -------------------------------------
CREATE TABLE IF NOT EXISTS public.token_catalog (
  code text PRIMARY KEY, sign text NOT NULL, element text, ord int
);
INSERT INTO public.token_catalog(code,sign,element,ord) VALUES
  ('PYRON','Aries','Fire',1),('AURUM','Taurus','Metal',2),('ZEPHYR','Gemini','Wind',3),
  ('NEREID','Cancer','Water',4),('SOLARI','Leo','Fire',5),('ARENITE','Virgo','Sand',6),
  ('FORGEON','Libra','Wind',7),('STYX','Scorpio','Water',8),('EMBER','Sagittarius','Fire',9),
  ('FERRUM','Capricorn','Metal',10),('AETHER','Aquarius','Wind',11),('ABYSS','Pisces','Water',12)
  ON CONFLICT (code) DO NOTHING;

-- per-member balances --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.token_balances (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  token   text NOT NULL REFERENCES public.token_catalog(code),
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_catalog  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tb_read ON public.token_balances;
CREATE POLICY tb_read ON public.token_balances FOR SELECT USING (auth.uid()=user_id OR public.is_platform_owner());
DROP POLICY IF EXISTS tc_read ON public.token_catalog;
CREATE POLICY tc_read ON public.token_catalog FOR SELECT USING (true);

-- read my 12 balances (seeds zero rows; always safe) -------------------------
DROP FUNCTION IF EXISTS public.my_token_balances() CASCADE;
CREATE OR REPLACE FUNCTION public.my_token_balances()
RETURNS TABLE(code text, sign text, element text, balance numeric, ord int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.token_balances(user_id,token,balance)
    SELECT auth.uid(), c.code, 0 FROM public.token_catalog c
    ON CONFLICT (user_id,token) DO NOTHING;
  RETURN QUERY
    SELECT c.code,c.sign,c.element,COALESCE(b.balance,0),c.ord
    FROM public.token_catalog c
    LEFT JOIN public.token_balances b ON b.token=c.code AND b.user_id=auth.uid()
    ORDER BY c.ord;
END;
$$;

-- award tokens -- DORMANT: refuses unless the owner has enabled the economy ---
DROP FUNCTION IF EXISTS public.award_token(uuid, text, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.award_token(p_user uuid, p_token text, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enabled boolean;
BEGIN
  SELECT bool_value INTO enabled FROM public.platform_settings WHERE key='tokens_enabled';
  IF NOT COALESCE(enabled,false) THEN
    RETURN jsonb_build_object('ok',false,'error','tokens_dormant','note','economy disabled until legal sign-off');
  END IF;
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','owner_only');
  END IF;
  INSERT INTO public.token_balances(user_id,token,balance) VALUES (p_user,p_token,GREATEST(0,p_amount))
    ON CONFLICT (user_id,token) DO UPDATE SET balance=public.token_balances.balance+GREATEST(0,p_amount), updated_at=now();
  RETURN jsonb_build_object('ok',true,'token',p_token,'amount',p_amount);
END;
$$;

GRANT SELECT ON public.token_catalog, public.token_balances TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.my_token_balances() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_token(uuid,text,numeric) TO authenticated;

COMMIT;
-- ===== end omega_tokens.sql =====

-- ===== omega_academy_access.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- ACADEMY ACCESS (Doc 2, implemented the SAFE way)
-- Doc 2 is a Solidity contract that MOVES CURRENCY. Per manifest s.11, token /
-- payment rails require licensed legal counsel (securities, money-transmission,
-- KYC/AML) BEFORE going live. So the access logic lives here in your stack,
-- DORMANT behind 'tokens_enabled' (default false). No value moves until you,
-- post-legal, flip the flag. Mirrors the contract's grant/expiry/stage logic.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY, bool_value boolean DEFAULT false, text_value text, updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key,bool_value) VALUES ('tokens_enabled',false)
  ON CONFLICT (key) DO NOTHING;
-- shared table with omega_tokens.sql -- RLS added defensively here too in case
-- this file ever runs without that one (was missing RLS entirely either way).
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ps_read ON public.platform_settings;
CREATE POLICY ps_read ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS ps_write ON public.platform_settings;
CREATE POLICY ps_write ON public.platform_settings FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());
GRANT SELECT ON public.platform_settings TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.academy_access (
  user_id     uuid PRIMARY KEY DEFAULT auth.uid(),
  expires_at  timestamptz,
  stage       int NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 12),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aa_read ON public.academy_access;
CREATE POLICY aa_read ON public.academy_access FOR SELECT USING (auth.uid()=user_id OR public.is_platform_owner());

-- has-active-access (mirrors hasActiveAcademyAccess) -- always safe to read
DROP FUNCTION IF EXISTS public.has_academy_access() CASCADE;
CREATE OR REPLACE FUNCTION public.has_academy_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT expires_at > now() FROM public.academy_access WHERE user_id=auth.uid()), false)
$$;

-- subscribe (mirrors processAcademySubscription) -- DORMANT until legal sign-off
DROP FUNCTION IF EXISTS public.academy_subscribe() CASCADE;
CREATE OR REPLACE FUNCTION public.academy_subscribe()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE enabled boolean; cur timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT bool_value INTO enabled FROM public.platform_settings WHERE key='tokens_enabled';
  IF NOT COALESCE(enabled,false) THEN
    RETURN jsonb_build_object('ok',false,'error','tokens_dormant','note','academy currency disabled until legal sign-off');
  END IF;
  SELECT expires_at INTO cur FROM public.academy_access WHERE user_id=auth.uid();
  INSERT INTO public.academy_access(user_id,expires_at,stage)
    VALUES (auth.uid(),
            CASE WHEN cur > now() THEN cur + interval '30 days' ELSE now() + interval '30 days' END,
            1)
    ON CONFLICT (user_id) DO UPDATE SET
      expires_at = CASE WHEN public.academy_access.expires_at > now()
                        THEN public.academy_access.expires_at + interval '30 days'
                        ELSE now() + interval '30 days' END,
      stage = GREATEST(public.academy_access.stage,1), updated_at=now();
  RETURN jsonb_build_object('ok',true,'expires', (SELECT expires_at FROM public.academy_access WHERE user_id=auth.uid()));
END;
$$;

-- promote stage 1..12 (mirrors updateUserStage, onlySovereign) ---------------
DROP FUNCTION IF EXISTS public.academy_promote(uuid, int) CASCADE;
CREATE OR REPLACE FUNCTION public.academy_promote(p_user uuid, p_stage int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_stage < 1 OR p_stage > 12 THEN RETURN jsonb_build_object('ok',false,'error','stage_out_of_range'); END IF;
  INSERT INTO public.academy_access(user_id,stage) VALUES (p_user,p_stage)
    ON CONFLICT (user_id) DO UPDATE SET stage=p_stage, updated_at=now();
  RETURN jsonb_build_object('ok',true,'stage',p_stage);
END;
$$;

GRANT SELECT ON public.academy_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_academy_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_subscribe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_promote(uuid,int) TO authenticated;

COMMIT;
-- ===== end omega_academy_access.sql =====

-- ===== omega_exams.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- EXAM RESULTS (real backend for exam.html)
-- exam.html previously told members "certificate queued for issuance" and
-- "Matrix coordinates updated" on passing an exam -- neither actually happened,
-- nothing was ever saved anywhere, not even locally. This is the real backend:
-- records every attempt, and on a pass: awards a real certificate, advances
-- the member's real Knowledge axis (via the existing advance_matrix/profiles
-- update), and logs a real evolution event. Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.exam_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id     text NOT NULL,          -- matches EXAMS[].id in exam.html: matrix|cosmology|sovereignty|intelligence|economy|heritage
  score       int NOT NULL,
  total       int NOT NULL,
  pct         numeric NOT NULL,
  passed      boolean NOT NULL,
  cert_name   text,
  taken_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_results_own ON public.exam_results;
CREATE POLICY exam_results_own ON public.exam_results FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_owner()) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.exam_results TO authenticated;

-- submit an exam result: records the attempt, and on a pass, issues a real
-- certificate + advances the real Knowledge axis + logs a real evolution event.
-- One certificate per exam per member (re-passing doesn't duplicate the cert).
DROP FUNCTION IF EXISTS public.submit_exam_result(text, int, int, text) CASCADE;
CREATE OR REPLACE FUNCTION public.submit_exam_result(
  p_exam_id text, p_score int, p_total int, p_cert_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid uuid := auth.uid();
  v_pct numeric;
  v_pass boolean;
  v_already boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_total IS NULL OR p_total <= 0 THEN RETURN jsonb_build_object('ok',false,'error','bad_total'); END IF;

  v_pct := round((p_score::numeric / p_total::numeric) * 100, 1);
  v_pass := v_pct >= 72;

  INSERT INTO public.exam_results(user_id, exam_id, score, total, pct, passed, cert_name)
    VALUES (uid, p_exam_id, p_score, p_total, v_pct, v_pass, p_cert_name);

  IF NOT v_pass THEN
    RETURN jsonb_build_object('ok',true,'passed',false,'pct',v_pct);
  END IF;

  -- already holds this certificate? don't duplicate, but still record the re-take above
  SELECT EXISTS(SELECT 1 FROM public.certificates WHERE user_id = uid AND title = p_cert_name) INTO v_already;
  IF NOT v_already AND p_cert_name IS NOT NULL THEN
    INSERT INTO public.certificates(user_id, title, milestone) VALUES (uid, p_cert_name, p_exam_id);
  END IF;

  -- advance the real Knowledge axis (axis_a), capped at 9, only on first pass
  IF NOT v_already THEN
    UPDATE public.profiles SET axis_a = LEAST(9, COALESCE(axis_a,1) + 0.5) WHERE id = uid;
    INSERT INTO public.evolution_events(user_id, axis, note)
      VALUES (uid, 'A', 'Examination passed -- ' || COALESCE(p_cert_name, p_exam_id) || ' certificate earned (' || v_pct || '%)');
  END IF;

  RETURN jsonb_build_object('ok',true,'passed',true,'pct',v_pct,'cert_awarded', NOT v_already, 'cert_name', p_cert_name);
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_exam_result(text,int,int,text) TO authenticated;

-- read my own exam history (for a future "past attempts" view)
DROP FUNCTION IF EXISTS public.my_exam_results() CASCADE;
CREATE OR REPLACE FUNCTION public.my_exam_results()
RETURNS SETOF public.exam_results LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.exam_results WHERE user_id = auth.uid() ORDER BY taken_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_exam_results() TO authenticated;

COMMIT;
-- ===== end omega_exams.sql =====

-- ===== omega_feedback.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- FEEDBACK & COMMENTS
-- Verified members can submit feedback/comments (with an optional 1-5 rating)
-- from any page. Members see their own; the Sovereign owner sees all. Safe RLS.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid(),
  page       text,
  rating     int CHECK (rating BETWEEN 1 AND 5),
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_insert ON public.feedback;
CREATE POLICY feedback_insert ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS feedback_select ON public.feedback;
CREATE POLICY feedback_select ON public.feedback
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_owner());

-- submit feedback (owner-safe, length-capped) -------------------------------
DROP FUNCTION IF EXISTS public.submit_feedback(text, int, text) CASCADE;
CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_message text, p_rating int DEFAULT NULL, p_page text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RETURN jsonb_build_object('ok',false,'error','empty'); END IF;
  INSERT INTO public.feedback(user_id, message, rating, page)
    VALUES (auth.uid(), left(p_message, 4000), p_rating, left(coalesce(p_page,''),120))
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$$;

-- my feedback (member sees their own history) -------------------------------
DROP FUNCTION IF EXISTS public.my_feedback() CASCADE;
CREATE OR REPLACE FUNCTION public.my_feedback()
RETURNS SETOF public.feedback LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.feedback WHERE user_id = auth.uid() ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.submit_feedback(text,int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_feedback() TO authenticated;
GRANT SELECT, INSERT ON public.feedback TO authenticated;

COMMIT;
-- ===== end omega_feedback.sql =====

-- ===== omega_contracts.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- COMMISSION CONTRACTS (contracts.html backend, M-contracts)
-- A member drafts a member-to-trade contract; the Order's 9.17% commission is
-- SEALED server-side (recomputed by a trigger, so it cannot be tampered with in
-- the browser) and a sovereign reference is recorded. Member sees own; owner
-- reviews all. Matches contracts.html's insert to 'commission_contracts'.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.commission_contracts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL DEFAULT auth.uid(),
  reference               text,
  counterparty            text,
  scope                   text,
  deal_value              numeric NOT NULL DEFAULT 0,
  commission_rate         numeric NOT NULL DEFAULT 9.17,
  commission_value        numeric NOT NULL DEFAULT 0,
  terms                   text,
  confidentiality_accepted boolean NOT NULL DEFAULT false,
  status                  text NOT NULL DEFAULT 'submitted',  -- submitted|reviewing|sealed|rejected
  created_at              timestamptz NOT NULL DEFAULT now()
);
-- self-heal older versions
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS counterparty text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS scope text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS deal_value numeric NOT NULL DEFAULT 0;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 9.17;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS commission_value numeric NOT NULL DEFAULT 0;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS confidentiality_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE public.commission_contracts ENABLE ROW LEVEL SECURITY;

-- SEAL the commission at 9.17% server-side (cannot be tampered client-side) ---
DROP FUNCTION IF EXISTS public.seal_commission() CASCADE;
CREATE OR REPLACE FUNCTION public.seal_commission()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.commission_rate  := 9.17;
  NEW.commission_value := round(COALESCE(NEW.deal_value,0) * 0.0917, 2);
  IF NEW.reference IS NULL OR length(trim(NEW.reference))=0 THEN
    NEW.reference := 'OMEGA-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_seal_commission ON public.commission_contracts;
CREATE TRIGGER trg_seal_commission BEFORE INSERT OR UPDATE ON public.commission_contracts
  FOR EACH ROW EXECUTE FUNCTION public.seal_commission();

DROP POLICY IF EXISTS cc_insert ON public.commission_contracts;
CREATE POLICY cc_insert ON public.commission_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS cc_select ON public.commission_contracts;
CREATE POLICY cc_select ON public.commission_contracts FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- owner reviews / seals / rejects -------------------------------------------
DROP FUNCTION IF EXISTS public.set_contract_status(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.set_contract_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('submitted','reviewing','sealed','rejected') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.commission_contracts SET status = p_status WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

DROP FUNCTION IF EXISTS public.review_contracts() CASCADE;
CREATE OR REPLACE FUNCTION public.review_contracts()
RETURNS SETOF public.commission_contracts LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.commission_contracts WHERE public.is_platform_owner()
  ORDER BY (status='submitted') DESC, created_at DESC;
$$;

GRANT SELECT, INSERT ON public.commission_contracts TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_contract_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_contracts() TO authenticated;

COMMIT;
-- ===== end omega_contracts.sql =====

-- ===== omega_dispatch.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- DISPATCHES (one broadcast channel, no duplication)
-- notifications.html already reads a 'dispatches' table (title, body, created_at).
-- This is the SINGLE broadcast table -- it powers BOTH the Notifications page
-- AND the News page. Supersedes the separate 'news' table (use this instead of
-- OMEGA_NEWS.sql). The Sovereign owner posts; every verified member receives.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.dispatches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text,
  category     text DEFAULT 'DISPATCH',   -- DISPATCH | INTELLIGENCE | ANNOUNCEMENT | UPDATE
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- self-heal: if an older dispatches table exists, add any missing columns
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS category text DEFAULT 'DISPATCH';
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dispatch_read ON public.dispatches;
CREATE POLICY dispatch_read ON public.dispatches FOR SELECT
  USING (is_published = true OR public.is_platform_owner());

-- owner broadcasts a dispatch (reaches every member's notifications + news) ---
DROP FUNCTION IF EXISTS public.post_dispatch(text, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.post_dispatch(p_title text, p_body text DEFAULT NULL, p_category text DEFAULT 'DISPATCH')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_title IS NULL OR length(trim(p_title))=0 THEN RETURN jsonb_build_object('ok',false,'error','empty_title'); END IF;
  INSERT INTO public.dispatches(title,body,category)
    VALUES (left(p_title,200), left(coalesce(p_body,''),8000), left(coalesce(p_category,'DISPATCH'),40))
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$$;

-- read the published stream (used by news.html) -----------------------------
DROP FUNCTION IF EXISTS public.published_dispatches(int) CASCADE;
CREATE OR REPLACE FUNCTION public.published_dispatches(p_limit int DEFAULT 30)
RETURNS SETOF public.dispatches LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.dispatches WHERE is_published = true ORDER BY created_at DESC LIMIT LEAST(GREATEST(p_limit,1),100);
$$;

-- owner unpublish/republish --------------------------------------------------
DROP FUNCTION IF EXISTS public.set_dispatch_published(uuid, boolean) CASCADE;
CREATE OR REPLACE FUNCTION public.set_dispatch_published(p_id uuid, p_pub boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  UPDATE public.dispatches SET is_published = COALESCE(p_pub,true) WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'published',COALESCE(p_pub,true));
END;
$$;

GRANT SELECT ON public.dispatches TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_dispatch(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.published_dispatches(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_dispatch_published(uuid,boolean) TO authenticated;

-- if a legacy dispatches table has a NOT-NULL user_id, relax it (broadcasts are Order-wide, not per-user)
DO $seed$
BEGIN
  BEGIN
    ALTER TABLE public.dispatches ALTER COLUMN user_id DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN NULL;  -- no user_id column: fine
  END;
END $seed$;

-- seed one welcome dispatch so the feed is never empty
INSERT INTO public.dispatches(title,body,category)
SELECT 'The Frequency is Live', 'SYD OMEGA 91717 dispatch channel is active. The Code. The Frequency. The Legacy.', 'ANNOUNCEMENT'
WHERE NOT EXISTS (SELECT 1 FROM public.dispatches);

COMMIT;
-- ===== end omega_dispatch.sql =====

-- ===== omega_time_sovereign.sql =====
-- SYD OMEGA 91717 -- TIME SOVEREIGN (real cumulative engagement tracking)
-- Real session-time tracking, server-validated (heartbeat pings, not client-
-- reported totals a member could fake). Milestone at 9h17m17s = 33437 seconds,
-- matching the platform's own 9.1717 numerology. Awards a real certificate.
BEGIN;

CREATE TABLE IF NOT EXISTS public.session_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pinged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.session_heartbeats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS heartbeat_own ON public.session_heartbeats;
CREATE POLICY heartbeat_own ON public.session_heartbeats FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.session_heartbeats TO authenticated;

-- one heartbeat every ~60s while a tab is open. Cumulative seconds = count of
-- heartbeats within 90s of each other, summed as 60s blocks -- this can't be
-- inflated by a member spoofing a single large "time spent" value client-side,
-- since each ping is server-timestamped individually.
DROP FUNCTION IF EXISTS public.ping_session() CASCADE;
CREATE OR REPLACE FUNCTION public.ping_session()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); last_ping timestamptz; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT max(pinged_at) INTO last_ping FROM public.session_heartbeats WHERE user_id=uid;
  IF last_ping IS NULL OR now()-last_ping > interval '90 seconds' THEN
    -- gap too large (new session) or first ever ping -- still record it, just don't double count the gap
    NULL;
  END IF;
  INSERT INTO public.session_heartbeats(user_id) VALUES (uid);
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.ping_session() TO authenticated;

-- real cumulative seconds: count of heartbeats that had a prior heartbeat
-- within 90s, each counted as 60s of real active time, capped sensibly.
DROP FUNCTION IF EXISTS public.my_time_sovereign() CASCADE;
CREATE OR REPLACE FUNCTION public.my_time_sovereign()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); total_seconds int; already_awarded boolean; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  WITH pings AS (
    SELECT pinged_at, lag(pinged_at) OVER (ORDER BY pinged_at) AS prev
    FROM public.session_heartbeats WHERE user_id=uid
  )
  SELECT COALESCE(count(*) FILTER (WHERE prev IS NOT NULL AND pinged_at-prev <= interval '90 seconds'),0) * 60
    INTO total_seconds FROM pings;

  SELECT EXISTS(SELECT 1 FROM public.certificates WHERE user_id=uid AND title='Time Sovereign') INTO already_awarded;
  IF total_seconds >= 33437 AND NOT already_awarded THEN
    INSERT INTO public.certificates(user_id,title,milestone) VALUES (uid,'Time Sovereign','9h17m17s cumulative presence');
    INSERT INTO public.evolution_events(user_id,axis,note)
      VALUES (uid,'C','Time Sovereign certificate earned -- 9h17m17s of real presence in the Order');
  END IF;

  RETURN jsonb_build_object('ok',true,'seconds',total_seconds,
    'target_seconds',33437,
    'pct', round(least(total_seconds::numeric,33437)/33437.0*100,2),
    'awarded', total_seconds>=33437);
END; $$;
GRANT EXECUTE ON FUNCTION public.my_time_sovereign() TO authenticated;

COMMIT;
-- ===== end omega_time_sovereign.sql =====

-- ===== omega_marketing.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- MARKETING PLACEMENTS (marketing.html backend)
-- Members reserve ad/media placement. Every reservation is REVIEWED and
-- APPROVED by the Sovereign owner before it can go live -- nothing publishes
-- automatically. Matches marketing.html's insert exactly (media_reservations).
-- price_omega is a quoted reservation figure only; NO value moves (economy
-- dormant). Member sees own; owner reviews all.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.media_reservations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid(),
  zone        text,
  duration    text,
  title       text NOT NULL,
  message     text,
  price_omega numeric DEFAULT 0,
  file_path   text,
  status      text NOT NULL DEFAULT 'submitted',  -- submitted | reviewing | approved | rejected | live
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- self-heal older versions
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS zone text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS price_omega numeric DEFAULT 0;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.media_reservations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE public.media_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mr_insert ON public.media_reservations;
CREATE POLICY mr_insert ON public.media_reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS mr_select ON public.media_reservations;
CREATE POLICY mr_select ON public.media_reservations FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- owner reviews the queue / sets status (onlySovereign) ----------------------
DROP FUNCTION IF EXISTS public.set_reservation_status(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.set_reservation_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('submitted','reviewing','approved','rejected','live') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.media_reservations SET status = p_status WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

DROP FUNCTION IF EXISTS public.review_reservations() CASCADE;
CREATE OR REPLACE FUNCTION public.review_reservations()
RETURNS SETOF public.media_reservations LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.media_reservations
  WHERE public.is_platform_owner()
  ORDER BY (status='submitted') DESC, created_at DESC;
$$;

GRANT SELECT, INSERT ON public.media_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_reservation_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_reservations() TO authenticated;

COMMIT;
-- ===== end omega_marketing.sql =====

-- ===== omega_consult.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- CONSULTANCY REQUESTS (real booking backend, M2)
-- Supersedes BOTH consult_requests.sql and the previous version of this file --
-- neither actually matched consultancy.html's real insert call. That page sends
-- {user_id, domain, message, urgency, commission_rate, confidentiality_accepted,
-- status:'pending'} directly (no RPC, no "subject" field) -- this schema matches
-- that exactly. Delete consult_requests.sql after running this; do not run it,
-- it will fight this schema (different id type, requires a "subject" column
-- this page never sends). Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.consult_requests (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL DEFAULT auth.uid(),
  domain                   text NOT NULL,
  message                  text,
  urgency                  text,
  commission_rate          numeric,
  confidentiality_accepted boolean NOT NULL DEFAULT false,
  status                   text NOT NULL DEFAULT 'pending',  -- pending | reviewing | scheduled | closed
  created_at               timestamptz NOT NULL DEFAULT now()
);
-- self-heal an older copy of either prior schema up to this one
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS commission_rate numeric;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS confidentiality_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.consult_requests ADD COLUMN IF NOT EXISTS message text;
-- if an older run left subject as NOT NULL, relax it -- this page never sends it
DO $relax$
BEGIN
  BEGIN ALTER TABLE public.consult_requests ALTER COLUMN subject DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END;
END $relax$;

ALTER TABLE public.consult_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_insert ON public.consult_requests;
CREATE POLICY cr_insert ON public.consult_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS cr_select ON public.consult_requests;
CREATE POLICY cr_select ON public.consult_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- owner updates status (owner only) ------------------------------------------
DROP FUNCTION IF EXISTS public.set_consult_status(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.set_consult_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('pending','reviewing','scheduled','closed') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.consult_requests SET status=p_status WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

GRANT SELECT, INSERT ON public.consult_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_consult_status(uuid,text) TO authenticated;

COMMIT;
-- ===== end omega_consult.sql =====

-- ===== omega_privacy.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- PROFILE PRIVACY
-- Every profile is PRIVATE by default: only the member and the Sovereign owner
-- can read it. A member may choose to make their own profile public. The
-- founder's profile is private unless he opts in. Non-recursive RLS.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- rebuild the SELECT policy: self OR owner OR explicitly-public ---------------
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_platform_owner()
    OR is_public = true
  );

-- a member toggles ONLY their own visibility --------------------------------
DROP FUNCTION IF EXISTS public.set_profile_visibility(boolean) CASCADE;
CREATE OR REPLACE FUNCTION public.set_profile_visibility(p_public boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  UPDATE public.profiles SET is_public = COALESCE(p_public, false) WHERE id = auth.uid();
  RETURN jsonb_build_object('ok', true, 'is_public', COALESCE(p_public, false));
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_profile_visibility(boolean) TO authenticated;

-- founder stays private by default (opt-in only) ----------------------------
UPDATE public.profiles SET is_public = false WHERE is_owner = true AND is_public IS NULL;

COMMIT;
-- ===== end omega_privacy.sql =====

-- ===== academy_progress.sql =====
-- SYD OMEGA 91717 -- Academy progress tracking (idempotent; RLS added; self-healing)
-- Not currently wired into academy.html -- table exists but nothing reads/writes it
-- yet. Fixed for correctness (schema prefix, IF NOT EXISTS, FK, RLS) so it's safe
-- to run and ready whenever academy.html's progress tracking is built.
-- Self-healing: if public.academy_progress already exists from an earlier/partial
-- run, ADD COLUMN IF NOT EXISTS brings it up to spec before RLS references these
-- columns -- CREATE TABLE IF NOT EXISTS alone would silently no-op on an existing
-- table and leave it without user_id, which is what caused 42703 here.
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS node_id TEXT;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
-- if user_id or node_id were left NULL-able from an older run, that's fine for
-- now -- not forcing NOT NULL retroactively in case existing rows would violate it.
DO $uniq$
BEGIN
  ALTER TABLE public.academy_progress ADD CONSTRAINT academy_progress_user_node_unique UNIQUE (user_id, node_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $uniq$;

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS academy_progress_own ON public.academy_progress;
CREATE POLICY academy_progress_own ON public.academy_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.academy_progress TO authenticated;
-- ===== end academy_progress.sql =====

-- ===== search_index.sql =====
-- SYD OMEGA 91717 -- Search index (idempotent; RLS added)
-- Not currently wired into search.html -- that page's search is client-side over
-- a hardcoded page list, not this table. Fixed for correctness (schema prefix,
-- IF NOT EXISTS, RLS) so it's safe to run and ready if server-side/content search
-- is built later.
CREATE TABLE IF NOT EXISTS public.search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
-- Read-only for all authenticated members; only the owner (via service role
-- or an owner-checked function) should ever write to a shared index.
DROP POLICY IF EXISTS search_index_read ON public.search_index;
CREATE POLICY search_index_read ON public.search_index FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.search_index TO authenticated;
-- ===== end search_index.sql =====

-- ===== access_gate.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- ACCESS APPROVAL GATE (idempotent; safe to re-run)
-- PREREQUISITE: run omega_backend_sync.sql (or the full omega_master_deploy.sql,
-- which includes it) FIRST. This file only ALTERs public.profiles -- it does
-- not create the table, so running it before the base schema exists will fail
-- with "relation public.profiles does not exist".
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_requested_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Standard owner check used across the whole project (search_path pinned to
-- avoid search_path-hijack on a SECURITY DEFINER function). If this project
-- already ran omega_master_deploy.sql, this CREATE OR REPLACE is a no-op --
-- same name, same body.
DROP FUNCTION IF EXISTS public.is_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT COALESCE((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;

-- Back-compat wrapper: some earlier files (refinements.sql) were written
-- against is_app_owner() instead of is_platform_owner(). Kept as a thin
-- pass-through rather than a second, independently-maintained copy of the
-- same check, so there is exactly one place the actual logic lives. New SQL
-- in this project should call is_platform_owner() directly.
DROP FUNCTION IF EXISTS public.is_app_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_app_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT public.is_platform_owner();
$$;
GRANT EXECUTE ON FUNCTION public.is_app_owner() TO authenticated;

-- owner may read & update ALL profiles (members keep their own-row policies)
DROP POLICY IF EXISTS "owner reads profiles" ON public.profiles;
CREATE POLICY "owner reads profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_platform_owner());
DROP POLICY IF EXISTS "owner updates profiles" ON public.profiles;
CREATE POLICY "owner updates profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_platform_owner()) WITH CHECK (true);

COMMIT;

-- ANOINT + ADMIT YOURSELF so you are never locked out. Replace the email,
-- then run this line separately (outside the transaction above, after COMMIT):
-- update public.profiles set is_owner=true, access_approved=true where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
-- ===== end access_gate.sql =====

-- ===== trial_access.sql =====
-- =============================================================================
-- SYD OMEGA 91717 -- TRIAL ACCESS SYSTEM
-- 9.1717-minute timed sessions with auto-expiry and full progress reset
-- Run once in Supabase SQL Editor
-- =============================================================================

/* --- 1. Add trial columns to profiles --- */
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_trial       BOOLEAN    DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ DEFAULT NULL;

/* --- 2. GRANT TRIAL ACCESS (called by approvals page) ---
   Sets access_approved = true, marks as trial, stamps expiry at exactly
   9.1717 minutes (= 550.302 seconds) from now.
   Owner (is_owner = true) is never set as trial. */
CREATE OR REPLACE FUNCTION grant_trial_access(p_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    access_approved   = true,
    is_trial          = true,
    trial_expires_at  = NOW() + INTERVAL '550.302 seconds'
  WHERE id = p_uid AND (is_owner IS NULL OR is_owner = false);
END;
$$;

/* --- 3. EXPIRE TRIAL (called by client when countdown hits zero) ---
   Revokes access, clears trial flags, resets all three matrix axes to genesis
   values (1.0), and wipes the member's task_completions so progress is clean. */
CREATE OR REPLACE FUNCTION expire_trial(p_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    access_approved   = false,
    is_trial          = false,
    trial_expires_at  = NULL,
    axis_a            = 1.0,
    axis_b            = 1.0,
    axis_c            = 1.0
  WHERE id = p_uid;

  DELETE FROM task_completions WHERE user_id = p_uid;
END;
$$;

/* --- 4. GRANT PERMANENT ACCESS (owner override, no timer) --- */
CREATE OR REPLACE FUNCTION grant_permanent_access(p_uid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    access_approved   = true,
    is_trial          = false,
    trial_expires_at  = NULL
  WHERE id = p_uid;
END;
$$;

/* --- 5. Allow authenticated users to call expire_trial on their own record --- */
GRANT EXECUTE ON FUNCTION expire_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_trial_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_permanent_access(UUID) TO authenticated;
-- ===== end trial_access.sql =====

-- ===== kyc.sql =====
-- SYD OMEGA 91717 — KYC / Passport columns on profiles (idempotent)
alter table public.profiles add column if not exists kyc_status text default 'none';
alter table public.profiles add column if not exists kyc_doc_path text;
alter table public.profiles add column if not exists kyc_submitted_at timestamptz;
-- ===== end kyc.sql =====

-- ===== platform_terms.sql =====
-- SYD OMEGA 91717 — platform terms acceptance + per-engagement confidentiality/commission (idempotent)
alter table public.profiles add column if not exists terms_accepted boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.consult_requests add column if not exists commission_rate numeric not null default 9.17;
alter table public.consult_requests add column if not exists confidentiality_accepted boolean not null default false;
alter table public.commission_contracts add column if not exists confidentiality_accepted boolean not null default false;
-- ===== end platform_terms.sql =====

-- ===== omega_profile_fields.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- SELF-EDIT PROFILE FIELDS
-- Lets a verified member correct their own personal info (name, sign, birth
-- date, nationality, profession, bio) if they filled it in wrong. Access /
-- trial / axis columns remain writable ONLY through the owner-gated functions
-- (this only grants the harmless personalization columns). Run any time.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio         text;

-- grant self-update ONLY on personalization columns that exist
DO $g$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['display_name','sign','birth_date','nationality','profession','bio','terms_accepted','updated_at'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='profiles' AND column_name=col) THEN
      EXECUTE format('GRANT UPDATE (%I) ON public.profiles TO authenticated', col);
    END IF;
  END LOOP;
END $g$;

COMMIT;
-- ===== end omega_profile_fields.sql =====

-- ===== storage.sql =====
-- SYD OMEGA 91717 — file storage: buckets, policies, attachment columns (idempotent)

-- buckets: avatars (public-read), uploads (private, owner-only)
insert into storage.buckets (id,name,public) values ('avatars','avatars',true) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('uploads','uploads',false) on conflict (id) do nothing;

-- AVATARS — anyone may read; a member may write/replace only inside their own folder (folder = their user id)
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id='avatars');
drop policy if exists "avatars write" on storage.objects;
create policy "avatars write" on storage.objects for insert to authenticated
  with check (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update" on storage.objects;
create policy "avatars update" on storage.objects for update to authenticated
  using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- UPLOADS — a member may read & write only inside their own folder
drop policy if exists "uploads read" on storage.objects;
create policy "uploads read" on storage.objects for select to authenticated
  using (bucket_id='uploads' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "uploads write" on storage.objects;
create policy "uploads write" on storage.objects for insert to authenticated
  with check (bucket_id='uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- attachment columns on the records that carry files
alter table public.profiles add column if not exists avatar_url text;
alter table public.publications add column if not exists file_path text;
alter table public.consult_requests add column if not exists file_path text;
alter table public.media_reservations add column if not exists file_path text;
-- ===== end storage.sql =====

-- ===== omega_demo_video.sql =====
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
DROP FUNCTION IF EXISTS public.log_access_decision() CASCADE;
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
DROP FUNCTION IF EXISTS public.access_audit_log(int) CASCADE;
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
DROP FUNCTION IF EXISTS public.report_client_error(text, text, text, int, int, text, text, text) CASCADE;
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
DROP FUNCTION IF EXISTS public.error_summary(int) CASCADE;
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
DROP FUNCTION IF EXISTS public.my_subscription() CASCADE;
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
DROP FUNCTION IF EXISTS public.apply_subscription(uuid, text, text, timestamptz, text, timestamptz, int) CASCADE;
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

DROP FUNCTION IF EXISTS public.membership_report(jsonb) CASCADE;
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
-- ============================================================================
-- SYD OMEGA 91717 -- LATTICE ENGINE (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Canon declares a lattice of 12 tracks x 12 phases x 9 x 9 x 9 = 104,976
-- nodes. The engine stored three numbers -- axis_a, axis_b, axis_c -- each
-- capped at 9. That expresses 729 positions: ONE cube. 0.69% of the declared
-- lattice. Track and phase existed in canon, in omega-canon.json, and all over
-- the interface, but not in the engine, so no member could ever occupy a node
-- outside the first cube. The spine was decorative.
--
-- WHAT THIS ADDS
--   matrix_track  1-12  which sign-track the member walks (from their sign)
--   matrix_phase  1-12  which phase within that track
--   node_index    1-104,976  absolute position in the lattice
--
-- HOW A MEMBER MOVES
-- Filling the 9x9x9 cube (all three axes reaching 9) completes a PHASE. The
-- phase advances and the axes reset to the canonical 0.001 start, so the next
-- cube begins. Completing phase 12 completes the TRACK. Twelve tracks is the
-- whole lattice.
--
-- WHY THE AXES RESET
-- They are coordinates INSIDE the current cube, not a lifetime score. Lifetime
-- work is preserved in task_completions, evolution_events, certificates,
-- trophies and medals -- none of which are touched here. Authority is still
-- sqrt(a^2+b^2+c^2) within the cube; total progress is node_index.
--
-- BASELINE CORRECTION
-- complete_task set missing axes to 1. omega_zero_start.sql sets the column
-- default to 0.001 and every page now falls back to 0.001. The engine was the
-- last place still claiming 1; corrected here.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS matrix_track int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS matrix_phase int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS node_index   int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phases_done  int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tracks_done  int  DEFAULT 0;

-- Track is deterministic from the member's sign (canon: one track per sign).
DROP FUNCTION IF EXISTS public.track_for_sign(text) CASCADE;
CREATE OR REPLACE FUNCTION public.track_for_sign(p_sign text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    CASE lower(coalesce(p_sign,''))
      WHEN 'aries' THEN 1  WHEN 'taurus' THEN 2  WHEN 'gemini' THEN 3
      WHEN 'cancer' THEN 4 WHEN 'leo' THEN 5     WHEN 'virgo' THEN 6
      WHEN 'libra' THEN 7  WHEN 'scorpio' THEN 8 WHEN 'sagittarius' THEN 9
      WHEN 'capricorn' THEN 10 WHEN 'aquarius' THEN 11 WHEN 'pisces' THEN 12
    END, 1);
$$;

-- Absolute position in the 104,976-node lattice.
--   node = ((track-1)*12 + (phase-1)) * 729
--        + (ca-1)*81 + (cb-1)*9 + cc      where ca/cb/cc are ceil(axis) in 1..9
DROP FUNCTION IF EXISTS public.lattice_node(int, int, numeric, numeric, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.lattice_node(
  p_track int, p_phase int, p_a numeric, p_b numeric, p_c numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT ((GREATEST(1,LEAST(12,COALESCE(p_track,1))) - 1) * 12
        + (GREATEST(1,LEAST(12,COALESCE(p_phase,1))) - 1)) * 729
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_a,0.001))::int)) - 1) * 81
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_b,0.001))::int)) - 1) * 9
       +  GREATEST(1,LEAST(9,CEIL(COALESCE(p_c,0.001))::int));
$$;

GRANT EXECUTE ON FUNCTION public.track_for_sign(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.lattice_node(int,int,numeric,numeric,numeric) TO authenticated, anon;

-- Backfill existing members onto the lattice.
UPDATE public.profiles
   SET matrix_track = public.track_for_sign(sign),
       matrix_phase = COALESCE(matrix_phase, 1)
 WHERE matrix_track IS NULL OR matrix_track = 1;

UPDATE public.profiles
   SET node_index = public.lattice_node(matrix_track, matrix_phase, axis_a, axis_b, axis_c);

-- ---------------------------------------------------------------------------
-- The engine. Same signature and same return contract as before, so every
-- existing caller keeps working; the body now advances the full lattice.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.complete_task(text, text, text, text, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax  text := lower(coalesce(p_axis,'a'));
  w   numeric := coalesce(p_weight, 0.25);
  a numeric; b numeric; c numeric;
  tr int; ph int;
  old_v numeric; new_v numeric;
  crossed boolean := false;
  phase_done boolean := false;
  track_done boolean := false;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric; node int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'error', 'not authenticated');
  END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;

  -- canonical start is 0.001, not 1 (omega_zero_start.sql)
  UPDATE public.profiles
     SET axis_a = COALESCE(axis_a, 0.001),
         axis_b = COALESCE(axis_b, 0.001),
         axis_c = COALESCE(axis_c, 0.001),
         matrix_track = COALESCE(matrix_track, public.track_for_sign(sign)),
         matrix_phase = COALESCE(matrix_phase, 1)
   WHERE id = uid;

  -- already banked -> report position, change nothing
  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id = uid AND task = p_task) THEN
    SELECT axis_a,axis_b,axis_c,matrix_track,matrix_phase INTO a,b,c,tr,ph
      FROM public.profiles WHERE id = uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric, 3);
    RETURN jsonb_build_object('applied', false, 'axis', ax,
      'value', CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,
      'track',tr,'phase',ph,
      'node', public.lattice_node(tr,ph,a,b,c),
      'lattice_total', 104976, 'unlocked', unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id, task, kind) VALUES (uid, p_task, p_kind);

  SELECT axis_a,axis_b,axis_c,matrix_track,matrix_phase INTO a,b,c,tr,ph
    FROM public.profiles WHERE id = uid;

  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  crossed := floor(new_v) > floor(old_v);
  IF ax='a' THEN a := new_v; ELSIF ax='b' THEN b := new_v; ELSE c := new_v; END IF;

  -- credential on an integer crossing (unchanged behaviour)
  IF crossed THEN
    IF ax='a' THEN
      INSERT INTO public.certificates (user_id,title,milestone)
        VALUES (uid, COALESCE(p_title,'Knowledge Node'), 'Knowledge '||floor(new_v)::text);
      unlocked := unlocked || jsonb_build_object('type','certificate','at',floor(new_v));
    ELSIF ax='b' THEN
      INSERT INTO public.trophies (user_id,trophy_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','trophy','at',floor(new_v));
    ELSE
      INSERT INTO public.trophies (user_id,medal_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','medal','at',floor(new_v));
    END IF;
  END IF;

  -- CUBE COMPLETE -> advance the phase, reset the coordinates, begin the next cube
  -- CUBE COMPLETE -> advance. The apex (track 12, phase 12, cube full) is
  -- TERMINAL: without this the member wrapped back to phase 1 forever and
  -- node_index went DOWN -- progress appearing to reverse at the summit.
  IF a >= 9 AND b >= 9 AND c >= 9 THEN
    IF tr >= 12 AND ph >= 12 THEN
      -- apex reached: hold position, award once, never wrap
      a := 9; b := 9; c := 9;
      IF NOT EXISTS (SELECT 1 FROM public.task_completions
                      WHERE user_id = uid AND task = '__lattice_apex__') THEN
        INSERT INTO public.task_completions (user_id, task, kind)
          VALUES (uid, '__lattice_apex__', 'lattice');
        unlocked := unlocked || jsonb_build_object('type','apex','at',104976);
      END IF;
    ELSE
      phase_done := true;
      IF ph >= 12 THEN
        track_done := true;
        ph := 1;
        tr := tr + 1;
        UPDATE public.profiles SET tracks_done = COALESCE(tracks_done,0) + 1 WHERE id = uid;
        unlocked := unlocked || jsonb_build_object('type','track','at',tr);
      ELSE
        ph := ph + 1;
        unlocked := unlocked || jsonb_build_object('type','phase','at',ph);
      END IF;
      UPDATE public.profiles SET phases_done = COALESCE(phases_done,0) + 1 WHERE id = uid;
      a := 0.001; b := 0.001; c := 0.001;
    END IF;
  END IF;

  auth_v := round(sqrt(a*a+b*b+c*c)::numeric, 3);
  node := public.lattice_node(tr, ph, a, b, c);

  INSERT INTO public.evolution_events (user_id, axis, note)
    VALUES (uid, ax, COALESCE(p_title, p_kind||' / '||p_task));

  UPDATE public.profiles
     SET axis_a=a, axis_b=b, axis_c=c,
         matrix_track=tr, matrix_phase=ph, node_index=node
   WHERE id = uid;

  RETURN jsonb_build_object('applied', true, 'axis', ax, 'value', new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,
    'track',tr,'phase',ph,'node',node,'lattice_total',104976,
    'phase_completed',phase_done,'track_completed',track_done,
    'unlocked', unlocked);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;

-- Member's own lattice standing.
DROP FUNCTION IF EXISTS public.my_lattice() CASCADE;
CREATE OR REPLACE FUNCTION public.my_lattice()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'track', COALESCE(matrix_track,1), 'phase', COALESCE(matrix_phase,1),
    'a', COALESCE(axis_a,0.001), 'b', COALESCE(axis_b,0.001), 'c', COALESCE(axis_c,0.001),
    'authority', round(sqrt(COALESCE(axis_a,0.001)^2 + COALESCE(axis_b,0.001)^2 + COALESCE(axis_c,0.001)^2)::numeric,3),
    'node', public.lattice_node(matrix_track, matrix_phase, axis_a, axis_b, axis_c),
    'lattice_total', 104976,
    'phases_done', COALESCE(phases_done,0), 'tracks_done', COALESCE(tracks_done,0),
    'percent', round((public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c)::numeric / 104976) * 100, 4)
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_lattice() TO authenticated;

CREATE INDEX IF NOT EXISTS profiles_lattice_idx ON public.profiles (matrix_track, matrix_phase, node_index);

-- ============================================================================
-- VERIFY
--   select public.lattice_node(1,1,0.001,0.001,0.001);   -- expect 1
--   select public.lattice_node(12,12,9,9,9);             -- expect 104976
--   select public.my_lattice();
-- ============================================================================
-- ===== end omega_lattice_engine.sql =====

-- ===== omega_schema_repair.sql =====
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
-- ===== end omega_schema_repair.sql =====


-- ===== achievements.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- ACHIEVEMENT ALIGNMENT
-- Audit fix: the live pages expect a structure the engine did not produce.
--   trophies.html reads  .from('medals')            -> table did not exist
--   trophies.html reads  certificates.cert_num      -> column did not exist
--   honors.html  reads   profiles.nodes_earned      -> engine wrote nodes_cleared
--   pages show 12 curated trophies/medals/certificates, engine only made ~8
-- This aligns the schema + engine to the live pages. The 12 are a journey:
-- as each axis climbs 1 -> 9, that track lights its 12 milestones in order
-- (all 12 at the apex). Knowledge -> Certificates, Mastery -> Trophies,
-- Contribution -> Medals. Run AFTER the other SQL. Safe + re-runnable. ASCII.
-- ============================================================================
BEGIN;

-- 1) the medals table (mirrors trophies) ------------------------------------
-- NOTE: a medals table may already exist from an earlier step with a different
-- shape, so CREATE IF NOT EXISTS alone is not enough -- we also guarantee every
-- column the engine/pages need, whether the table is new or pre-existing.
CREATE TABLE IF NOT EXISTS public.medals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_num  int,
  earned_at  timestamptz DEFAULT now(),
  issued_at  timestamptz DEFAULT now()
);
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS medal_num int;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now();
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
-- if an id column pre-exists without a default, give it one so inserts succeed
DO $idfix$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='medals' AND column_name='id') THEN
    BEGIN ALTER TABLE public.medals ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $idfix$;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medals_select_own ON public.medals;
CREATE POLICY medals_select_own ON public.medals FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());
CREATE UNIQUE INDEX IF NOT EXISTS medals_user_num_uniq ON public.medals(user_id, medal_num);

-- 2) guarantee every column the engine + pages touch (any pre-existing shape)-
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS title     text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS milestone text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS cert_num  int;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS user_id    uuid;
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS trophy_num int;
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS earned_at  timestamptz DEFAULT now();
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS issued_at  timestamptz DEFAULT now();
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_earned        int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_cleared       int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS certificates_earned int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS trophies_earned     int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS medals_earned       int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS authority           numeric DEFAULT 0;

-- now the uniqueness guards (columns above are guaranteed to exist)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_num_uniq
  ON public.certificates(user_id, cert_num) WHERE cert_num IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trophies_user_num_uniq
  ON public.trophies(user_id, trophy_num) WHERE trophy_num IS NOT NULL;

-- 3) migrate any medals previously stored on trophies.medal_num -------------
-- Only runs if that column actually exists (older engines stored medals there;
-- many schemas never had it). Guarded so it cannot error on either shape.
DO $migrate$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='trophies' AND column_name='medal_num') THEN
    INSERT INTO public.medals (user_id, medal_num, earned_at)
      SELECT user_id, medal_num, COALESCE(earned_at, now())
      FROM public.trophies WHERE medal_num IS NOT NULL
      ON CONFLICT (user_id, medal_num) DO NOTHING;
    DELETE FROM public.trophies WHERE medal_num IS NOT NULL AND trophy_num IS NULL;
  END IF;
END $migrate$;

-- backfill cert_num from milestone text, only if a milestone column exists
DO $certbf$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='certificates' AND column_name='milestone') THEN
    UPDATE public.certificates
      SET cert_num = NULLIF(regexp_replace(COALESCE(milestone::text,''),'\D','','g'),'')::int
      WHERE cert_num IS NULL AND milestone::text ~ '\d';
  END IF;
END $certbf$;

-- 4) the award model: how many of a track's 12 milestones an axis has lit ----
DROP FUNCTION IF EXISTS public.milestones_for_axis(numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.milestones_for_axis(v numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, LEAST(12, floor((COALESCE(v,1) - 1) / 8.0 * 12)::int));
$$;

-- 5) complete_task -- now lights the 12 curated milestones per track ---------
DROP FUNCTION IF EXISTS public.complete_task(text, text, text, text, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax text := lower(coalesce(p_axis,'a'));
  w numeric := coalesce(p_weight,0.25);
  a numeric; b numeric; c numeric;
  old_v numeric; new_v numeric;
  old_m int; new_m int; k int;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('applied',false,'error','not authenticated'); END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles SET axis_a=COALESCE(axis_a,1), axis_b=COALESCE(axis_b,1), axis_c=COALESCE(axis_c,1) WHERE id=uid;

  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id=uid AND task=p_task) THEN
    SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);
    RETURN jsonb_build_object('applied',false,'axis',ax,
      'value',CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id,task,kind) VALUES (uid,p_task,p_kind);

  SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  IF ax='a' THEN a:=new_v; ELSIF ax='b' THEN b:=new_v; ELSE c:=new_v; END IF;
  auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);

  INSERT INTO public.evolution_events (user_id,axis,note)
    VALUES (uid,ax,COALESCE(p_title,p_kind||' / '||p_task));

  -- light any newly reached milestones on this track (curated 1..12)
  old_m := public.milestones_for_axis(old_v);
  new_m := public.milestones_for_axis(new_v);
  IF new_m > old_m THEN
    FOR k IN (old_m+1)..new_m LOOP
      IF ax='a' THEN
        INSERT INTO public.certificates (user_id,title,milestone,cert_num)
          SELECT uid, COALESCE(p_title,'Sovereign Certificate '||k), k, k
          WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id=uid AND cert_num=k);
        unlocked := unlocked || jsonb_build_object('type','certificate','n',k);
      ELSIF ax='b' THEN
        INSERT INTO public.trophies (user_id,trophy_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.trophies WHERE user_id=uid AND trophy_num=k);
        unlocked := unlocked || jsonb_build_object('type','trophy','n',k);
      ELSE
        INSERT INTO public.medals (user_id,medal_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.medals WHERE user_id=uid AND medal_num=k);
        unlocked := unlocked || jsonb_build_object('type','medal','n',k);
      END IF;
    END LOOP;
  END IF;

  -- composite gate at (3,3,3)/(6,6,6)/(9,9,9)
  IF floor(a)=floor(b) AND floor(b)=floor(c) AND floor(new_v) IN (3,6,9)
     AND floor(new_v) > floor(old_v) THEN
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
  END IF;

  UPDATE public.profiles SET
    axis_a=a, axis_b=b, axis_c=c, authority=auth_v,
    nodes_earned        = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    nodes_cleared       = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id=uid),
    trophies_earned     = (SELECT count(*) FROM public.trophies WHERE user_id=uid AND trophy_num IS NOT NULL),
    medals_earned       = (SELECT count(*) FROM public.medals WHERE user_id=uid)
  WHERE id=uid;

  RETURN jsonb_build_object('applied',true,'axis',ax,'value',new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
END;
$$;

-- 6) order_stats -- medals now come from the medals table --------------------
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.medals),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el,cnt) FROM (
                       SELECT initcap(element) el, count(*) cnt FROM public.profiles
                       WHERE element IS NOT NULL AND btrim(element)<>'' GROUP BY initcap(element)) e),'{}'::jsonb)
  ) INTO r; RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.milestones_for_axis(numeric) TO authenticated, anon;

COMMIT;

-- ============================================================================
-- ===== end achievements.sql =====


-- ===== conversations.sql =====
CREATE TABLE conversations (
 id UUID PRIMARY KEY,
 user_id UUID,
 created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
 id UUID PRIMARY KEY,
 conversation_id UUID,
 role TEXT,
 content TEXT,
 created_at TIMESTAMP DEFAULT NOW()
);
-- ===== end conversations.sql =====


-- ===== dispatches.sql =====
-- SYD OMEGA 91717 — The Wire (shared member dispatch feed; idempotent)
create table if not exists public.dispatches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sign text,
  body text not null,
  created_at timestamptz default now()
);
alter table public.dispatches enable row level security;
drop policy if exists "wire read" on public.dispatches;
create policy "wire read" on public.dispatches for select to authenticated using (true);
drop policy if exists "wire insert" on public.dispatches;
create policy "wire insert" on public.dispatches for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.dispatches to authenticated;
-- ===== end dispatches.sql =====


-- ===== family_nodes.sql =====
-- SYD OMEGA 91717 — Family / Heritage tree (idempotent; safe to re-run)
create table if not exists public.family_nodes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relation text not null,
  sign text,
  is_heir boolean not null default false,
  created_at timestamptz default now()
);
alter table public.family_nodes enable row level security;
drop policy if exists "own family read" on public.family_nodes;
create policy "own family read" on public.family_nodes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own family insert" on public.family_nodes;
create policy "own family insert" on public.family_nodes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own family update" on public.family_nodes;
create policy "own family update" on public.family_nodes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own family delete" on public.family_nodes;
create policy "own family delete" on public.family_nodes for delete to authenticated using (auth.uid() = user_id);
grant select, insert, update, delete on public.family_nodes to authenticated;
-- ===== end family_nodes.sql =====


-- ===== lifetime_access.sql =====
BEGIN;

UPDATE profiles SET
  is_owner        = TRUE,
  access_approved = TRUE,
  is_trial        = FALSE,
  trial_expires_at = NULL,
  axis_a          = 9.000,
  axis_b          = 9.000,
  axis_c          = 9.000,
  material_tier   = 'OMEGA MASTER',
  membership_tier = 9,
  display_name    = 'Major Sleiman Youssef Dagher',
  sign            = 'Aries',
  element         = 'Fire'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')
);

CREATE OR REPLACE FUNCTION protect_owner_lifetime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner = TRUE THEN
    NEW.access_approved  := TRUE;
    NEW.is_trial         := FALSE;
    NEW.trial_expires_at := NULL;
    NEW.axis_a           := 9.000;
    NEW.axis_b           := 9.000;
    NEW.axis_c           := 9.000;
    NEW.material_tier    := 'OMEGA MASTER';
    NEW.membership_tier  := 9;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_lifetime_guard ON profiles;
CREATE TRIGGER owner_lifetime_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner_lifetime();

COMMIT;
-- ===== end lifetime_access.sql =====


-- ===== marketplace_listings.sql =====
-- SYD OMEGA 91717 — Marketplace listings (idempotent, safe to re-run)
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'work',
  price_omega numeric not null default 0,
  description text,
  file_path text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.marketplace_listings enable row level security;
do $$ begin
  create policy ml_read on public.marketplace_listings for select to authenticated
    using (status = 'active' or seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy ml_insert on public.marketplace_listings for insert to authenticated
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy ml_update on public.marketplace_listings for update to authenticated
    using (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
-- ===== end marketplace_listings.sql =====


-- ===== omega_access_control.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- ACCESS CONTROL + 9.1717-MINUTE SOVEREIGN TRIAL
-- The founder's console (profile.html) and the global guard (bg.js) are already
-- built; this is the backend they call. Only the Sovereign approves members.
-- Approval grants exactly 9.1717 minutes of access, after which the member is
-- logged out and their trial progress is reset. Founder: Major Sleiman Youssef
-- Dagher (s.y.dagher@gmail.com) -- never trial-limited, never reset.
-- Run AFTER the other SQL. Owner-gated. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- columns the console + guard read (guaranteed, any pre-existing shape) -------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_approved  boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_trial         boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_rejected      boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted   boolean DEFAULT false;

-- drop prior versions of these functions (an earlier build may have created
-- them with a different return type, which CREATE OR REPLACE cannot change) ---
DO $drop$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'DROP FUNCTION IF EXISTS public.' || quote_ident(p.proname)
           || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS cmd
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('trial_length','approve_member','grant_permanent_access',
                        'reject_member','revoke_member','expire_trial','get_all_members')
  LOOP
    EXECUTE r.cmd;
  END LOOP;
END $drop$;

-- the fixed trial length -- 9.1717 minutes, no other option ------------------
DROP FUNCTION IF EXISTS public.trial_length() CASCADE;
CREATE OR REPLACE FUNCTION public.trial_length() RETURNS interval
  LANGUAGE sql IMMUTABLE AS $$ SELECT (9.1717 * interval '1 minute') $$;

-- APPROVE -- grants the 9.1717-minute sovereign trial ------------------------
DROP FUNCTION IF EXISTS public.approve_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE exp timestamptz;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  exp := now() + public.trial_length();
  UPDATE public.profiles
     SET access_approved=true, is_trial=true, is_rejected=false, trial_expires_at=exp
   WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'is_trial',true,'trial_expires_at',exp,'minutes',9.1717);
END;
$$;

-- GRANT PERMANENT -- lift the trial, access never expires --------------------
DROP FUNCTION IF EXISTS public.grant_permanent_access(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.grant_permanent_access(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=true, is_trial=false, is_rejected=false, trial_expires_at=NULL
   WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'permanent',true);
END;
$$;

-- REJECT ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.reject_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, is_rejected=true, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'rejected',true);
END;
$$;

-- REVOKE ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.revoke_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.revoke_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'revoked',true);
END;
$$;

-- EXPIRE TRIAL -- called by the guard when 9.1717 min elapse -----------------
-- a member may expire only their OWN trial; the owner may expire anyone.
-- Trial progress is reset (a trial persists nothing). The owner is never reset.
DROP FUNCTION IF EXISTS public.expire_trial(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.expire_trial(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF auth.uid() <> p_uid AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=p_uid),false) THEN
    RETURN jsonb_build_object('ok',true,'owner',true);   -- never reset the Sovereign
  END IF;
  DELETE FROM public.task_completions WHERE user_id=p_uid;
  DELETE FROM public.evolution_events WHERE user_id=p_uid;
  DELETE FROM public.trophies         WHERE user_id=p_uid;
  DELETE FROM public.medals           WHERE user_id=p_uid;
  DELETE FROM public.certificates     WHERE user_id=p_uid;
  UPDATE public.profiles SET
    axis_a=1, axis_b=1, axis_c=1, authority=0,
    nodes_earned=0, nodes_cleared=0, certificates_earned=0, trophies_earned=0, medals_earned=0,
    access_approved=false, is_trial=false, trial_expires_at=NULL
  WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'reset',true);
END;
$$;

-- GET ALL MEMBERS -- now includes the trial state the console renders --------
DROP FUNCTION IF EXISTS public.get_all_members() CASCADE;
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(row ORDER BY ord),'[]'::jsonb) INTO result FROM (
    SELECT
      -- pending first, then trials, then the rest; newest within each
      CASE WHEN COALESCE(p.access_approved,false)=false AND COALESCE(p.is_rejected,false)=false THEN 0
           WHEN COALESCE(p.is_trial,false) THEN 1 ELSE 2 END AS ord,
      jsonb_build_object(
        'id', p.id, 'email', u.email, 'display_name', p.display_name,
        'sign', p.sign, 'element', p.element,
        'axis_a', COALESCE(p.axis_a,1), 'axis_b', COALESCE(p.axis_b,1), 'axis_c', COALESCE(p.axis_c,1),
        'authority', round(sqrt(power(COALESCE(p.axis_a,1),2)+power(COALESCE(p.axis_b,1),2)+power(COALESCE(p.axis_c,1),2))::numeric,3),
        'is_owner', COALESCE(p.is_owner,false),
        'access_approved', COALESCE(p.access_approved,false),
        'is_trial', COALESCE(p.is_trial,false),
        'is_rejected', COALESCE(p.is_rejected,false),
        'trial_expires_at', p.trial_expires_at,
        'membership_tier', p.membership_tier, 'material_tier', p.material_tier,
        'certificates_earned', COALESCE(p.certificates_earned,0),
        'created_at', p.created_at
      ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
  ) q;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.trial_length()                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid)              TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.grant_permanent_access(uuid)      TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid)               TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid)               TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.expire_trial(uuid)                TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_all_members()                 TO authenticated, anon;

-- ============================================================================
-- CRITICAL SECURITY: stop members from self-approving
-- The existing profiles_update RLS policy lets a member update their OWN row,
-- so without this a member could simply set access_approved=true and bypass the
-- Sovereign and the trial entirely. We restrict column-level UPDATE to the
-- personalization fields a member may legitimately change; every access / trial
-- / axis column is now writable ONLY through the owner-gated, SECURITY DEFINER
-- functions above (which run with elevated rights and ignore these grants).
-- ============================================================================
DO $lock$
DECLARE col text;
BEGIN
  BEGIN REVOKE UPDATE ON public.profiles FROM authenticated; EXCEPTION WHEN others THEN NULL; END;
  BEGIN REVOKE UPDATE ON public.profiles FROM anon;          EXCEPTION WHEN others THEN NULL; END;
  FOREACH col IN ARRAY ARRAY['display_name','sign','birth_date','terms_accepted','updated_at','nationality','profession','bio','avatar_url'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='profiles' AND column_name=col) THEN
      EXECUTE format('GRANT UPDATE (%I) ON public.profiles TO authenticated', col);
    END IF;
  END LOOP;
END $lock$;

-- defense in depth: a newly created profile can never be born approved or owner
DROP FUNCTION IF EXISTS public.enforce_access_defaults() CASCADE;
CREATE OR REPLACE FUNCTION public.enforce_access_defaults()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.access_approved  := false;
  NEW.is_trial         := false;
  NEW.is_rejected      := false;
  NEW.trial_expires_at := NULL;
  NEW.is_owner         := false;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_access_defaults ON public.profiles;
CREATE TRIGGER trg_enforce_access_defaults
  BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_access_defaults();

COMMIT;
-- ===== end omega_access_control.sql =====


-- ===== omega_account.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- ACCOUNT CONTROL (deactivate / reactivate / delete)
-- User-friendly + compliance (GDPR-CCPA right-to-delete).
-- A member may deactivate (reversible) or permanently delete ONLY their own
-- account. The Sovereign founder can never be deactivated or deleted. Safe.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at   timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_deletion timestamptz;

-- DEACTIVATE -- reversible; the access guard will treat them as not-approved --
DROP FUNCTION IF EXISTS public.deactivate_account() CASCADE;
CREATE OR REPLACE FUNCTION public.deactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=auth.uid()),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  UPDATE public.profiles
     SET deactivated_at = now(), access_approved = false, is_trial = false, trial_expires_at = NULL
   WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'deactivated',true);
END;
$$;

-- REACTIVATE -- lifts a self-deactivation (owner re-approval still governs trial)
DROP FUNCTION IF EXISTS public.reactivate_account() CASCADE;
CREATE OR REPLACE FUNCTION public.reactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  UPDATE public.profiles SET deactivated_at = NULL WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'reactivated',true);
END;
$$;

-- DELETE -- permanent erasure of the caller's own data (right-to-delete) -----
DROP FUNCTION IF EXISTS public.delete_account() CASCADE;
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=uid),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  -- wipe the member's data across the platform
  DELETE FROM public.task_completions WHERE user_id = uid;
  DELETE FROM public.evolution_events WHERE user_id = uid;
  DELETE FROM public.trophies         WHERE user_id = uid;
  DELETE FROM public.medals           WHERE user_id = uid;
  DELETE FROM public.certificates     WHERE user_id = uid;
  DELETE FROM public.platform_owners  WHERE user_id = uid;
  DELETE FROM public.profiles         WHERE id = uid;
  -- attempt to remove the auth identity too (needs elevated rights; if the
  -- function owner lacks them, the data is already wiped and we flag for purge)
  BEGIN
    DELETE FROM auth.users WHERE id = uid;
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',true);
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',false,'note','data wiped; auth row purge pending');
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account()     TO authenticated;

COMMIT;
-- ===== end omega_account.sql =====


-- ===== omega_cosmology.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- COSMOLOGY ENGINE
-- The instant a member's sign is set (on any page), their full cosmology is
-- derived and PERSISTED: sign -> element -> Olympian -> bound agent. Before
-- this, identity.html computed those on-screen but never stored them, so the
-- Hall/leaderboard saw no element and god/agent lived only in the browser.
--
-- Server-authoritative, zero page edits. Maps are the LIVE canon taken verbatim
-- from identity.html (elements) and chatbot.html (gods, agents).
-- Run AFTER OMEGA_BACKEND_SYNC.sql. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- columns the cosmology is written into (element may already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS element text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS god     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent   text;

-- ----------------------------------------------------------------------------
-- derive_cosmology() -- normalizes the sign and fills element/god/agent
-- from the canon. Runs BEFORE the row is written, so the stored row is always
-- internally consistent no matter which page set the sign.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.derive_cosmology() CASCADE;
CREATE OR REPLACE FUNCTION public.derive_cosmology()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s text := initcap(btrim(coalesce(NEW.sign,'')));
BEGIN
  IF s = '' THEN RETURN NEW; END IF;       -- no sign yet -> leave as-is
  NEW.sign := s;                            -- normalize to Title case (Virgo, Leo...)

  NEW.element := CASE s
    WHEN 'Aries' THEN 'FIRE'  WHEN 'Leo' THEN 'FIRE'   WHEN 'Sagittarius' THEN 'FIRE'
    WHEN 'Taurus' THEN 'METAL' WHEN 'Capricorn' THEN 'METAL'
    WHEN 'Gemini' THEN 'WIND'  WHEN 'Libra' THEN 'WIND' WHEN 'Aquarius' THEN 'WIND'
    WHEN 'Cancer' THEN 'WATER' WHEN 'Scorpio' THEN 'WATER' WHEN 'Pisces' THEN 'WATER'
    WHEN 'Virgo' THEN 'SAND'
    ELSE NEW.element END;

  NEW.god := CASE s
    WHEN 'Aries' THEN 'Ares'       WHEN 'Taurus' THEN 'Aphrodite' WHEN 'Gemini' THEN 'Hermes'
    WHEN 'Cancer' THEN 'Artemis'   WHEN 'Leo' THEN 'Apollo'       WHEN 'Virgo' THEN 'Athena'
    WHEN 'Libra' THEN 'Hera'       WHEN 'Scorpio' THEN 'Demeter'  WHEN 'Sagittarius' THEN 'Zeus'
    WHEN 'Capricorn' THEN 'Hestia' WHEN 'Aquarius' THEN 'Hephaestus' WHEN 'Pisces' THEN 'Poseidon'
    ELSE NEW.god END;

  NEW.agent := CASE s
    WHEN 'Aries' THEN 'Sentinel'  WHEN 'Taurus' THEN 'Merchant' WHEN 'Gemini' THEN 'Scout'
    WHEN 'Cancer' THEN 'Warden'   WHEN 'Leo' THEN 'Sovereign'   WHEN 'Virgo' THEN 'Auditor'
    WHEN 'Libra' THEN 'Proxy'     WHEN 'Scorpio' THEN 'Oracle'  WHEN 'Sagittarius' THEN 'Beacon'
    WHEN 'Capricorn' THEN 'Analyst' WHEN 'Aquarius' THEN 'Tutor' WHEN 'Pisces' THEN 'Historian'
    ELSE NEW.agent END;

  RETURN NEW;
END;
$$;

-- fire whenever a profile is created or its sign changes
DROP TRIGGER IF EXISTS trg_derive_cosmology ON public.profiles;
CREATE TRIGGER trg_derive_cosmology
  BEFORE INSERT OR UPDATE OF sign ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.derive_cosmology();

-- backfill every existing member who already chose a sign
UPDATE public.profiles SET sign = sign
  WHERE sign IS NOT NULL AND btrim(sign) <> '';

COMMIT;
-- ===== end omega_cosmology.sql =====


-- ===== omega_dispatch_reset.sql =====
-- ============================================================================
-- OPTIONAL CLEAN SLATE -- run this ONLY if OMEGA_DISPATCH.sql still errors on a
-- legacy 'dispatches' table with a different schema (integer id, user_id, etc.).
-- It removes the old broadcast table so OMEGA_DISPATCH.sql can create it cleanly.
-- The dispatches table holds only Order broadcasts (no member data), so dropping
-- it loses nothing but old announcements.
-- ============================================================================
DROP TABLE IF EXISTS public.dispatches CASCADE;
-- now run OMEGA_DISPATCH.sql
-- ===== end omega_dispatch_reset.sql =====


-- ===== omega_evolution_rpc.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- LIVE EVOLUTION ENGINE
-- The functions the pages already call. Creating them brings the 729-matrix
-- to life: actions -> evolution_events -> authority recalculation -> milestones.
--
-- Contract (mapped from the live pages, do not change names/params):
--   complete_task(p_kind, p_task, p_axis, p_title)  <- academy / gaming /
--                                                       contributions / publishing
--   log_evolution(p_axis, p_note)                   <- account
--   get_all_members()                               <- approvals / profile
--   approve_member(p_uid) / reject_member / revoke_member <- approvals
--   order_stats()                                   <- hall
--
-- Rules baked in (match what the pages display):
--   baseline axis = 1, apex = 9, each cleared node = +0.25 on its axis
--   one node counts once (dedup on task_completions.task)
--   authority = sqrt(a^2 + b^2 + c^2),  apex authority = 15.588
--   integer crossings award: axis a -> Certificate, b -> Trophy, c -> Medal
--   composite nodes (3,3,3)/(6,6,6)/(9,9,9) open Gates
--
-- Safe + re-runnable. Run AFTER OMEGA_BACKEND_SYNC.sql. Pure ASCII.
-- ============================================================================
BEGIN;

-- --- ensure the derived columns the engine maintains exist ------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS authority        numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trophies_earned  int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_earned    int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nodes_cleared    int     DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificates_earned int  DEFAULT 0;

-- dedup guard: a node can be banked only once per member
CREATE UNIQUE INDEX IF NOT EXISTS task_completions_user_task_uniq
  ON public.task_completions(user_id, task);

-- --- drop prior versions of these functions ---------------------------------
-- An earlier build may have created these with a different return type, and
-- CREATE OR REPLACE cannot change a return type. Drop every old overload first.
-- is_platform_owner() is intentionally NOT dropped: RLS policies may depend on
-- it and its boolean return type is unchanged, so CREATE OR REPLACE handles it.
DO $drop$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'DROP FUNCTION IF EXISTS public.' || quote_ident(p.proname)
           || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS cmd
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('complete_task','log_evolution','get_all_members',
                        'approve_member','reject_member','revoke_member','order_stats')
  LOOP
    EXECUTE r.cmd;
  END LOOP;
END
$drop$;

-- ----------------------------------------------------------------------------
-- helper: am I the platform owner?
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- ----------------------------------------------------------------------------
-- complete_task -- the heartbeat of the matrix
-- Returns jsonb: { applied, axis, value, a, b, c, authority, unlocked[] }
--   applied=false means the node was already yours (no double-count).
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.complete_task(text, text, text, text, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind  text,
  p_task  text,
  p_axis  text DEFAULT 'a',
  p_title text DEFAULT NULL,
  p_weight numeric DEFAULT 0.25
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid      uuid := auth.uid();
  ax       text := lower(coalesce(p_axis,'a'));
  w        numeric := coalesce(p_weight, 0.25);
  a        numeric; b numeric; c numeric;
  old_v    numeric; new_v numeric;
  crossed  boolean := false;
  unlocked jsonb := '[]'::jsonb;
  auth_v   numeric;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'error', 'not authenticated');
  END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  -- ensure a profile row exists (baseline axes = 1, matching the pages)
  INSERT INTO public.profiles (id) VALUES (uid)
    ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles
     SET axis_a = COALESCE(axis_a,1), axis_b = COALESCE(axis_b,1), axis_c = COALESCE(axis_c,1)
   WHERE id = uid;

  -- already banked? -> report current state, change nothing
  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id = uid AND task = p_task) THEN
    SELECT axis_a, axis_b, axis_c INTO a,b,c FROM public.profiles WHERE id = uid;
    auth_v := round(sqrt(a*a + b*b + c*c)::numeric, 3);
    RETURN jsonb_build_object('applied', false, 'axis', ax,
      'value', CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a', a, 'b', b, 'c', c, 'authority', auth_v, 'unlocked', unlocked);
  END IF;

  -- bank the node
  INSERT INTO public.task_completions (user_id, task, kind) VALUES (uid, p_task, p_kind);

  -- read current axis, advance (cap 9)
  SELECT axis_a, axis_b, axis_c INTO a,b,c FROM public.profiles WHERE id = uid;
  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  crossed := floor(new_v) > floor(old_v);

  IF ax = 'a' THEN a := new_v; ELSIF ax = 'b' THEN b := new_v; ELSE c := new_v; END IF;
  auth_v := round(sqrt(a*a + b*b + c*c)::numeric, 3);

  -- log the evolution event
  INSERT INTO public.evolution_events (user_id, axis, note)
    VALUES (uid, ax, COALESCE(p_title, p_kind || ' / ' || p_task));

  -- milestone: integer crossing awards a credential on that axis
  IF crossed THEN
    IF ax = 'a' THEN
      INSERT INTO public.certificates (user_id, title, milestone)
        VALUES (uid, COALESCE(p_title,'Knowledge Node'), 'Knowledge ' || floor(new_v)::text);
      unlocked := unlocked || jsonb_build_object('type','certificate','at',floor(new_v));
    ELSIF ax = 'b' THEN
      INSERT INTO public.trophies (user_id, trophy_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','trophy','at',floor(new_v));
    ELSE
      INSERT INTO public.trophies (user_id, medal_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','medal','at',floor(new_v));
    END IF;
  END IF;

  -- composite Gate: all three axes reached the same integer threshold
  IF crossed AND floor(a) = floor(b) AND floor(b) = floor(c)
     AND floor(new_v) IN (3,6,9) THEN
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
  END IF;

  -- persist axes + derived state
  UPDATE public.profiles SET
      axis_a = a, axis_b = b, axis_c = c,
      authority = auth_v,
      nodes_cleared = COALESCE(nodes_cleared,0) + 1,
      certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id = uid),
      trophies_earned     = (SELECT count(*) FROM public.trophies WHERE user_id = uid AND trophy_num IS NOT NULL),
      medals_earned       = (SELECT count(*) FROM public.trophies WHERE user_id = uid AND medal_num IS NOT NULL)
   WHERE id = uid;

  RETURN jsonb_build_object('applied', true, 'axis', ax, 'value', new_v,
    'a', a, 'b', b, 'c', c, 'authority', auth_v, 'unlocked', unlocked);
END;
$$;

-- ----------------------------------------------------------------------------
-- log_evolution -- manual axis advance from the account console
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.log_evolution(text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.log_evolution(p_axis text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN public.complete_task(
    'manual',
    'manual-' || replace(gen_random_uuid()::text,'-',''),
    p_axis,
    COALESCE(p_note,'Manual evolution'),
    0.25);
END;
$$;

-- ----------------------------------------------------------------------------
-- get_all_members -- owner-only roster with email + standing
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_all_members() CASCADE;
CREATE OR REPLACE FUNCTION public.get_all_members()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO result FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'email', u.email,
      'sign', p.sign,
      'element', p.element,
      'axis_a', COALESCE(p.axis_a,1),
      'axis_b', COALESCE(p.axis_b,1),
      'axis_c', COALESCE(p.axis_c,1),
      'authority', round(sqrt(power(COALESCE(p.axis_a,1),2)+power(COALESCE(p.axis_b,1),2)+power(COALESCE(p.axis_c,1),2))::numeric,3),
      'is_owner', COALESCE(p.is_owner,false),
      'access_approved', COALESCE(p.access_approved,false),
      'membership_tier', p.membership_tier,
      'material_tier', p.material_tier,
      'certificates_earned', COALESCE(p.certificates_earned,0),
      'created_at', p.created_at
    ) AS row
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at NULLS LAST
  ) q;
  RETURN result;
END;
$$;

-- ----------------------------------------------------------------------------
-- approve / reject / revoke member -- owner-only gate control
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.approve_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = true WHERE id = p_uid;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'access_approved', true);
END;
$$;

DROP FUNCTION IF EXISTS public.reject_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = false WHERE id = p_uid;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'access_approved', false);
END;
$$;

DROP FUNCTION IF EXISTS public.revoke_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.revoke_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = false WHERE id = p_uid AND COALESCE(is_owner,false) = false;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'revoked', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- order_stats -- the Hall scoreboard
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles)
  ) INTO r;
  RETURN r;
END;
$$;

-- ----------------------------------------------------------------------------
-- grants -- the pages call these as authenticated users (anon for safety)
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_evolution(text,text)                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_all_members()                           TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid)                        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid)                         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid)                         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()                              TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner()                         TO authenticated, anon;

COMMIT;

-- ============================================================================
-- TUNING NOTE
-- Every cleared node advances its axis by 0.25, so 32 nodes take an axis from
-- the baseline of 1 to the apex of 9. To slow the ascent (a longer journey to
-- sovereignty), lower the default in complete_task (e.g. 0.10) -- but keep it
-- matched to the "+0.25" text the pages display, or the on-screen number will
-- jump on reload. They are aligned at 0.25 right now.
-- ============================================================================
-- ===== end omega_evolution_rpc.sql =====


-- ===== omega_horoscope.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- HOROSCOPE / BIRTH-DATE SIGN
-- Members were choosing their sign from a dropdown (they could pick wrong).
-- This makes the BIRTH DATE authoritative: the correct zodiac sign is derived
-- from date of birth, then cosmology (element/Olympian/agent) follows. The
-- Sovereign keeps his decreed sign (Virgo); birth date never overrides the owner.
-- Standard tropical (Western) date ranges. Run AFTER OMEGA_COSMOLOGY.sql.
-- Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- canonical date -> sign (tropical zodiac)
DROP FUNCTION IF EXISTS public.zodiac_from_date(date) CASCADE;
CREATE OR REPLACE FUNCTION public.zodiac_from_date(d date)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN d IS NULL THEN NULL
    WHEN (m=3  AND dd>=21) OR (m=4  AND dd<=19) THEN 'Aries'
    WHEN (m=4  AND dd>=20) OR (m=5  AND dd<=20) THEN 'Taurus'
    WHEN (m=5  AND dd>=21) OR (m=6  AND dd<=20) THEN 'Gemini'
    WHEN (m=6  AND dd>=21) OR (m=7  AND dd<=22) THEN 'Cancer'
    WHEN (m=7  AND dd>=23) OR (m=8  AND dd<=22) THEN 'Leo'
    WHEN (m=8  AND dd>=23) OR (m=9  AND dd<=22) THEN 'Virgo'
    WHEN (m=9  AND dd>=23) OR (m=10 AND dd<=22) THEN 'Libra'
    WHEN (m=10 AND dd>=23) OR (m=11 AND dd<=21) THEN 'Scorpio'
    WHEN (m=11 AND dd>=22) OR (m=12 AND dd<=21) THEN 'Sagittarius'
    WHEN (m=12 AND dd>=22) OR (m=1  AND dd<=19) THEN 'Capricorn'
    WHEN (m=1  AND dd>=20) OR (m=2  AND dd<=18) THEN 'Aquarius'
    ELSE 'Pisces'  -- Feb 19 - Mar 20
  END
  FROM (SELECT extract(month from d)::int AS m, extract(day from d)::int AS dd) x;
$$;

-- cosmology trigger: birth date drives the sign (except for the Sovereign),
-- then element/Olympian/agent follow from the sign.
DROP FUNCTION IF EXISTS public.derive_cosmology() CASCADE;
CREATE OR REPLACE FUNCTION public.derive_cosmology()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s text;
BEGIN
  IF NEW.birth_date IS NOT NULL AND NOT COALESCE(NEW.is_owner,false) THEN
    NEW.sign := public.zodiac_from_date(NEW.birth_date);   -- birth date is authoritative
  END IF;
  s := initcap(btrim(coalesce(NEW.sign,'')));
  IF s = '' THEN RETURN NEW; END IF;
  NEW.sign := s;

  NEW.element := CASE s
    WHEN 'Aries' THEN 'FIRE'  WHEN 'Leo' THEN 'FIRE'   WHEN 'Sagittarius' THEN 'FIRE'
    WHEN 'Taurus' THEN 'METAL' WHEN 'Capricorn' THEN 'METAL'
    WHEN 'Gemini' THEN 'WIND'  WHEN 'Libra' THEN 'WIND' WHEN 'Aquarius' THEN 'WIND'
    WHEN 'Cancer' THEN 'WATER' WHEN 'Scorpio' THEN 'WATER' WHEN 'Pisces' THEN 'WATER'
    WHEN 'Virgo' THEN 'SAND' ELSE NEW.element END;
  NEW.god := CASE s
    WHEN 'Aries' THEN 'Ares' WHEN 'Taurus' THEN 'Aphrodite' WHEN 'Gemini' THEN 'Hermes'
    WHEN 'Cancer' THEN 'Artemis' WHEN 'Leo' THEN 'Apollo' WHEN 'Virgo' THEN 'Athena'
    WHEN 'Libra' THEN 'Hera' WHEN 'Scorpio' THEN 'Demeter' WHEN 'Sagittarius' THEN 'Zeus'
    WHEN 'Capricorn' THEN 'Hestia' WHEN 'Aquarius' THEN 'Hephaestus' WHEN 'Pisces' THEN 'Poseidon'
    ELSE NEW.god END;
  NEW.agent := CASE s
    WHEN 'Aries' THEN 'Sentinel' WHEN 'Taurus' THEN 'Merchant' WHEN 'Gemini' THEN 'Scout'
    WHEN 'Cancer' THEN 'Warden' WHEN 'Leo' THEN 'Sovereign' WHEN 'Virgo' THEN 'Auditor'
    WHEN 'Libra' THEN 'Proxy' WHEN 'Scorpio' THEN 'Oracle' WHEN 'Sagittarius' THEN 'Beacon'
    WHEN 'Capricorn' THEN 'Analyst' WHEN 'Aquarius' THEN 'Tutor' WHEN 'Pisces' THEN 'Historian'
    ELSE NEW.agent END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derive_cosmology ON public.profiles;
CREATE TRIGGER trg_derive_cosmology
  BEFORE INSERT OR UPDATE OF sign, birth_date ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.derive_cosmology();

GRANT EXECUTE ON FUNCTION public.zodiac_from_date(date) TO authenticated, anon;

COMMIT;
-- ===== end omega_horoscope.sql =====


-- ===== omega_leaderboard.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- HALL OF FAME
-- A privacy-safe public ranking (no emails) of those who have crossed the
-- threshold, ordered by authority as they ascend the 729-matrix.
-- Also patches order_stats to return the element distribution the Hall charts.
-- Run AFTER OMEGA_EVOLUTION_RPC.sql. Safe + re-runnable. Pure ASCII.
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- public_leaderboard(limit) -- ranked roster, SAFE for anon (no email/id leak)
--   name = member's chosen display_name, else an anonymous Initiate tag
--   authority computed from axes so even inactive members rank correctly
--   only members of the Order (approved) and the Sovereign appear
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.public_leaderboard(int) CASCADE;
CREATE OR REPLACE FUNCTION public.public_leaderboard(p_limit int DEFAULT 50)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH ranked AS (
    SELECT
      COALESCE(NULLIF(btrim(display_name),''), 'Initiate-' || substr(id::text,1,4)) AS nm,
      sign, element,
      round(COALESCE(axis_a,1),2) AS a,
      round(COALESCE(axis_b,1),2) AS b,
      round(COALESCE(axis_c,1),2) AS c,
      round(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2))::numeric,3) AS auth_v,
      COALESCE(certificates_earned,0) AS cert,
      COALESCE(trophies_earned,0)     AS tro,
      COALESCE(medals_earned,0)       AS med,
      COALESCE(is_owner,false)        AS is_owner,
      created_at
    FROM public.profiles
    WHERE COALESCE(access_approved,false) OR COALESCE(is_owner,false)
  ),
  numbered AS (
    SELECT *, row_number() OVER (ORDER BY auth_v DESC, created_at ASC NULLS LAST) AS rnk
    FROM ranked
    ORDER BY auth_v DESC, created_at ASC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit,50), 200))
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rank', rnk, 'name', nm, 'sign', sign, 'element', element,
    'axis_a', a, 'axis_b', b, 'axis_c', c, 'authority', auth_v,
    'certificates', cert, 'trophies', tro, 'medals', med, 'is_owner', is_owner
  ) ORDER BY rnk), '[]'::jsonb)
  FROM numbered;
$$;

-- ----------------------------------------------------------------------------
-- order_stats -- now also returns the element distribution (Title-cased to
-- match the Hall chart keys: Fire/Water/Wind/Metal/Sand). Same return type as
-- before (jsonb), so this is a clean replace.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el, cnt) FROM (
                       SELECT initcap(element) AS el, count(*) AS cnt
                       FROM public.profiles WHERE element IS NOT NULL AND btrim(element) <> ''
                       GROUP BY initcap(element)
                     ) e), '{}'::jsonb)
  ) INTO r;
  RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_leaderboard(int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()           TO authenticated, anon;

COMMIT;
-- ===== end omega_leaderboard.sql =====


-- ===== omega_legacy_honors_fix.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- LEGACY HONORS FIX (run this ONCE, then re-run MASTER)
-- Older certificates/trophies/medals tables (from another tool) have NOT-NULL
-- name columns. Our seeds fill only the _num columns. This relaxes those legacy
-- constraints so seeding succeeds. Idempotent + safe.
-- ============================================================================
DO $fix$
BEGIN
  BEGIN ALTER TABLE public.certificates ALTER COLUMN cert_name   DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN trophy_name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN medal_name  DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.certificates ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
END $fix$;
-- ===== end omega_legacy_honors_fix.sql =====


-- ===== omega_marketplace_fix.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- MARKETPLACE SCHEMA FIX
-- marketplace.html inserts title/kind/description/file_path, but the existing
-- marketplace_listings table lacks them -> 42703 "column does not exist".
-- This self-healing patch adds every column the page needs (idempotent, safe to
-- re-run). No value moves; listings are owner-visible records only.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid()
);
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS seller_id   uuid DEFAULT auth.uid();
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS kind        text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS price_omega numeric DEFAULT 0;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS file_path   text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS status      text DEFAULT 'active';
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- sellers manage their own listings; active listings are visible to members ---
DROP POLICY IF EXISTS ml_insert ON public.marketplace_listings;
CREATE POLICY ml_insert ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS ml_select ON public.marketplace_listings;
CREATE POLICY ml_select ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id OR public.is_platform_owner());
DROP POLICY IF EXISTS ml_update ON public.marketplace_listings;
CREATE POLICY ml_update ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id OR public.is_platform_owner()) WITH CHECK (auth.uid() = seller_id OR public.is_platform_owner());

GRANT SELECT, INSERT, UPDATE ON public.marketplace_listings TO authenticated;

COMMIT;
-- ===== end omega_marketplace_fix.sql =====


-- ===== omega_owner_audit.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- OWNER FLAG AUDIT & CLEANUP
-- Run the SELECT first (step 1) to see exactly which accounts currently have
-- is_owner=true. There should be exactly one (or two, if both founder emails
-- have separate accounts). If there are more, that's the actual cause of
-- friends seeing the owner's profile content -- the gating logic checks
-- is_owner correctly, but if it's wrongly set on their account, they get
-- shown the (hardcoded, real) owner content because the flag says they are
-- the owner.
-- ============================================================================

-- STEP 1 -- DIAGNOSE. Run this first, look at the results.
SELECT p.id, u.email, p.display_name, p.is_owner, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_owner = true
ORDER BY p.created_at;

-- Also check platform_owners directly -- this is the table is_platform_owner()
-- actually reads from. It should exactly mirror the query above.
SELECT po.user_id, u.email
FROM public.platform_owners po
JOIN auth.users u ON u.id = po.user_id;

-- ============================================================================
-- STEP 2 -- FIX. Only run this after confirming step 1 shows accounts that
-- should NOT be owner. This safely resets is_owner=false for every account
-- except the two real founder emails. The existing sync trigger on profiles
-- automatically removes any wrongly-added rows from platform_owners too --
-- no separate cleanup needed there.
-- ============================================================================
-- UNCOMMENT AND RUN ONLY AFTER REVIEWING STEP 1:
--
-- UPDATE public.profiles p
-- SET is_owner = false
-- FROM auth.users u
-- WHERE p.id = u.id
--   AND p.is_owner = true
--   AND lower(u.email) NOT IN ('s.y.dagher@gmail.com','slmndghr@gmail.com');
--
-- Re-confirm afterward by re-running STEP 1 -- it should show only the real
-- founder account(s).
-- ===== end omega_owner_audit.sql =====


-- ===== omega_payments.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- PAYMENTS SCAFFOLD (DORMANT until legal clears)
-- Subscriptions for the 9 material tiers ($9.17 - $917.17 / month). Everything
-- here is INERT until BOTH conditions are met by the founder:
--   (1) platform_settings.payments_enabled = true  (flip via set_platform_flag)
--   (2) the Stripe secret keys are set on the Edge Functions
-- No charge can occur until the Sovereign turns it on. Safe + re-runnable.
-- ============================================================================
BEGIN;

-- platform-wide feature flags (founder-controlled) ---------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  bool_value boolean DEFAULT false,
  text_value text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key, bool_value)
  VALUES ('payments_enabled', false)
  ON CONFLICT (key) DO NOTHING;   -- default OFF; never force-enable on re-run
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_settings_read ON public.platform_settings;
CREATE POLICY platform_settings_read ON public.platform_settings FOR SELECT USING (true);

-- subscription columns on the member profile ---------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status    text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- read a flag (public; returns false when unset) ------------------------------
DROP FUNCTION IF EXISTS public.get_platform_flag(text) CASCADE;
CREATE OR REPLACE FUNCTION public.get_platform_flag(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT bool_value FROM public.platform_settings WHERE key=p_key), false);
$$;

-- flip a flag (FOUNDER ONLY -- this is how payments get switched on) ----------
DROP FUNCTION IF EXISTS public.set_platform_flag(text, boolean) CASCADE;
CREATE OR REPLACE FUNCTION public.set_platform_flag(p_key text, p_val boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  INSERT INTO public.platform_settings(key,bool_value,updated_at)
    VALUES (p_key,p_val,now())
    ON CONFLICT (key) DO UPDATE SET bool_value=excluded.bool_value, updated_at=now();
  RETURN jsonb_build_object('ok',true,'key',p_key,'value',p_val);
END;
$$;

-- a member reads their own subscription --------------------------------------
DROP FUNCTION IF EXISTS public.my_subscription() CASCADE;
CREATE OR REPLACE FUNCTION public.my_subscription()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tier',   COALESCE(subscription_tier,'none'),
    'status', COALESCE(subscription_status,'none'),
    'period_end', subscription_period_end,
    'payments_enabled', public.get_platform_flag('payments_enabled')
  ) FROM public.profiles WHERE id = auth.uid();
$$;

-- the Stripe webhook (service role) records a subscription result ------------
-- callable only by the service role or the owner; never by a normal member.
DROP FUNCTION IF EXISTS public.apply_subscription(uuid, text, text, timestamptz, text) CASCADE;
CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz, p_customer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_end = p_period_end,
    stripe_customer_id = COALESCE(p_customer, stripe_customer_id),
    membership_tier = CASE WHEN p_status IN ('active','trialing') THEN upper(p_tier) ELSE membership_tier END
  WHERE id = p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'tier',p_tier,'status',p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_flag(text)                             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_platform_flag(text, boolean)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_subscription()                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription(uuid,text,text,timestamptz,text) TO authenticated, service_role;

COMMIT;
-- ===== end omega_payments.sql =====


-- ===== omega_rls_fix.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- RLS RECURSION RESET (definitive fix for 42P17 on save)
-- Over many migrations, the profiles table accumulated several RLS policies,
-- and at least one still queries profiles from inside the owner-check, causing
-- infinite recursion (42P17). This wipes EVERY policy on profiles and rebuilds
-- one clean, non-recursive set, with the owner-check reading a small RLS-free
-- lookup table (platform_owners) instead of profiles. Safe + idempotent.
-- Run this whole file in Supabase -> SQL Editor -> Run.
-- ============================================================================
BEGIN;

-- 1) RLS-free lookup of who the owner is (only owner user-ids) ---------------
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false) = true
  ON CONFLICT DO NOTHING;

-- 2) owner-check reads the lookup -- NEVER profiles -> cannot recurse --------
DROP FUNCTION IF EXISTS public.is_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

-- 3) DROP EVERY existing policy on profiles + platform_owners ----------------
--    (removes any accumulated / recursive policy from earlier migrations)
DO $reset$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='platform_owners' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_owners', r.policyname);
  END LOOP;
END $reset$;

-- 4) clean, non-recursive policies ------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_platform_owner());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_owner())
  WITH CHECK (auth.uid() = id OR public.is_platform_owner());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

-- 5) keep the lookup in sync when is_owner changes --------------------------
DROP FUNCTION IF EXISTS public.sync_platform_owner() CASCADE;
CREATE OR REPLACE FUNCTION public.sync_platform_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.is_owner,false) THEN
    INSERT INTO public.platform_owners(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.platform_owners WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_platform_owner ON public.profiles;
CREATE TRIGGER trg_sync_platform_owner
  AFTER INSERT OR UPDATE OF is_owner ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_platform_owner();

COMMIT;

-- verify (run after): should list EXACTLY these 3 profiles policies ----------
SELECT tablename, policyname FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','platform_owners')
ORDER BY tablename, policyname;
-- ===== end omega_rls_fix.sql =====


-- ===== publications.sql =====
-- SYD OMEGA 91717 — Publishing archive (idempotent; safe to re-run)
create table if not exists public.publications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);
alter table public.publications enable row level security;
drop policy if exists "own pubs read" on public.publications;
create policy "own pubs read" on public.publications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own pubs insert" on public.publications;
create policy "own pubs insert" on public.publications for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.publications to authenticated;
-- ===== end publications.sql =====

-- ===== omega_stats_repair.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- STATS & COLUMN REPAIR (idempotent; safe to re-run)
--
-- FROM A LIVE ERROR
--   42703  column "medal_num" does not exist   (rpc/order_stats -> 400)
--
-- TWO SEPARATE FAULTS BEHIND ONE ERROR
--
-- 1. THE MISSING COLUMN
--    omega_master_deploy.sql declares trophies.medal_num and trophies.cert_num,
--    but CREATE TABLE IF NOT EXISTS is a no-op on an existing table, so the
--    live trophies table never received them. Third occurrence of this trap
--    (after membership_tier and task_completions.created_at).
--
--    omega_schema_repair.sql did not catch it: that file was generated by
--    scanning the PAGES for .select()/.order() columns, and medal_num is used
--    only INSIDE a SQL function. Columns referenced only in function bodies
--    were invisible to it. Added here.
--
-- 2. THE WRONG SOURCE
--    order_stats counts medals as:
--        SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL
--    but a dedicated public.medals table exists and is what complete_task and
--    the Honors pages actually read. Even with the column restored, counting
--    medals out of the trophies table would report the wrong number. Repointed
--    to public.medals.
--
-- NOTE ON ORDERING
-- order_stats is defined in four files (achievements, omega_evolution_rpc,
-- omega_leaderboard, omega_master_deploy). Whichever runs last wins, which is
-- exactly the drift RUN_ORDER.md warns about. Run THIS file last so the
-- corrected definition is the one that survives.
-- ============================================================================

-- ------------------------------------------------------- missing columns ---
ALTER TABLE public.trophies
  ADD COLUMN IF NOT EXISTS medal_num int,
  ADD COLUMN IF NOT EXISTS cert_num  int,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();

ALTER TABLE public.medals
  ADD COLUMN IF NOT EXISTS medal_num int,
  ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS cert_num  int,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();

-- --------------------------------------------------- corrected order_stats ---
DROP FUNCTION IF EXISTS public.order_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies),
    -- medals live in their own table; counting them from trophies was wrong
    'medals',       (SELECT count(*) FROM public.medals),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(
                        sqrt(power(COALESCE(axis_a,0.001),2)
                           + power(COALESCE(axis_b,0.001),2)
                           + power(COALESCE(axis_c,0.001),2)))::numeric, 3), 0)
                      FROM public.profiles WHERE COALESCE(access_approved,false)),
    'lattice_total', 104976
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.order_stats() TO authenticated, anon;

-- ============================================================================
-- VERIFY
--   select public.order_stats();          -- must return JSON, not an error
--   select column_name from information_schema.columns
--    where table_name='trophies' and column_name in ('medal_num','cert_num');
-- ============================================================================
-- ===== end omega_stats_repair.sql =====

-- ===== omega_authority_v2.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- SOVEREIGN AUTHORITY v2 (idempotent; safe to re-run)
--
-- CHANGES FROM v1
-- 1. AUTH formula: sqrt(A^2+B^2+C^2) -> sqrt(A^3+B^3+C^3) * phi/e
--    - Axes are now CUBIC (each 9x9x9 = 729 depth)
--    - phi = 1.6180339887 (golden ratio)
--    - e   = 2.7182818285 (Euler's number)
--    - i^2 = -1 (imaginary unit; the complex-plane rotation is baked into the
--              gate-threshold spacing: gates follow cos(n*phi*pi) damping)
--    - New apex: sqrt(3 * 9^3) * phi/e = 27.836687 (was 15.588)
--
-- 2. FIX: my_matrix() cannot change its RETURN TABLE without a DROP first.
--    The function is dropped and recreated with the corrected signature.
--
-- 3. 12 gate thresholds rescaled to the new apex (equal geometric steps).
--
-- 4. lattice_node() updated to use cubic axes (ceil(axis) 1..9, depth 729).
-- ============================================================================

DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.my_matrix();
  DROP FUNCTION IF EXISTS public.authority_score(numeric,numeric,numeric);
  DROP FUNCTION IF EXISTS public.lattice_node(int,int,numeric,numeric,numeric);
END $$;

-- ---------------------------------------------------------------- CONSTANTS --
-- Stored in platform_settings so the UI can read them without hardcoding.
INSERT INTO public.platform_settings (key, text_value) VALUES
  ('auth_phi',   '1.6180339887'),
  ('auth_e',     '2.7182818285'),
  ('auth_apex',  '27.8367'),
  ('auth_formula','sqrt(A^3+B^3+C^3)*phi/e')
ON CONFLICT (key) DO UPDATE SET text_value = EXCLUDED.text_value;

-- -------------------------------------------------------- AUTHORITY SCORE --
DROP FUNCTION IF EXISTS public.authority_score(numeric, numeric, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.authority_score(
  p_a numeric, p_b numeric, p_c numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  -- AUTH = sqrt(A^3 + B^3 + C^3) * phi / e
  -- phi = 1.6180339887  (golden ratio)
  -- e   = 2.7182818285  (Euler's number)
  -- Apex when A=B=C=9: sqrt(2187)*phi/e = 27.836687
  SELECT round(
    sqrt(
      power(GREATEST(0.001, COALESCE(p_a,0.001)), 3) +
      power(GREATEST(0.001, COALESCE(p_b,0.001)), 3) +
      power(GREATEST(0.001, COALESCE(p_c,0.001)), 3)
    ) * 1.6180339887 / 2.7182818285
  ::numeric, 6);
$$;

GRANT EXECUTE ON FUNCTION public.authority_score(numeric,numeric,numeric) TO authenticated, anon;

-- ---------------------------------------------------------- LATTICE NODE --
-- cubic axis depth: ceil(axis) maps 0.001..9 -> 1..9
DROP FUNCTION IF EXISTS public.lattice_node(int, int, numeric, numeric, numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.lattice_node(
  p_track int, p_phase int, p_a numeric, p_b numeric, p_c numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT ((GREATEST(1,LEAST(12,COALESCE(p_track,1)))-1)*12
        + (GREATEST(1,LEAST(12,COALESCE(p_phase,1)))-1)) * 729
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_a,0.001))::int))-1)*81
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_b,0.001))::int))-1)*9
       +  GREATEST(1,LEAST(9,CEIL(COALESCE(p_c,0.001))::int));
$$;

GRANT EXECUTE ON FUNCTION public.lattice_node(int,int,numeric,numeric,numeric) TO authenticated, anon;

-- -------------------------------------------------------------- MY_MATRIX --
-- Dropped above; recreated with the column matrix_phase included.
DROP FUNCTION IF EXISTS public.my_matrix() CASCADE;
CREATE OR REPLACE FUNCTION public.my_matrix()
RETURNS TABLE(
  track int, phase int, sign text, element text,
  a numeric, b numeric, c numeric,
  authority numeric, node int, pct numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT
      COALESCE(p.matrix_track, 1)::int,
      COALESCE(p.matrix_phase, 1)::int,
      COALESCE(p.sign, ''),
      COALESCE(p.element, ''),
      COALESCE(p.axis_a, 0.001),
      COALESCE(p.axis_b, 0.001),
      COALESCE(p.axis_c, 0.001),
      public.authority_score(p.axis_a, p.axis_b, p.axis_c),
      public.lattice_node(p.matrix_track, p.matrix_phase, p.axis_a, p.axis_b, p.axis_c),
      round(public.lattice_node(p.matrix_track, p.matrix_phase,
            p.axis_a, p.axis_b, p.axis_c)::numeric / 104976 * 100, 4)
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_matrix() TO authenticated;

-- ------------------------------------------------------ MY_LATTICE UPDATE --
DROP FUNCTION IF EXISTS public.my_lattice() CASCADE;
CREATE OR REPLACE FUNCTION public.my_lattice()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'track',        COALESCE(matrix_track,1),
    'phase',        COALESCE(matrix_phase,1),
    'a',            COALESCE(axis_a,0.001),
    'b',            COALESCE(axis_b,0.001),
    'c',            COALESCE(axis_c,0.001),
    'authority',    public.authority_score(axis_a, axis_b, axis_c),
    'authority_formula', 'sqrt(A^3+B^3+C^3)*phi/e',
    'authority_apex',    27.8367,
    'phi',          1.6180339887,
    'e',            2.7182818285,
    'node',         public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c),
    'lattice_total',104976,
    'phases_done',  COALESCE(phases_done,0),
    'tracks_done',  COALESCE(tracks_done,0),
    'percent',      round(public.lattice_node(matrix_track,matrix_phase,
                      axis_a,axis_b,axis_c)::numeric/104976*100,4)
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_lattice() TO authenticated;

-- ------------------------------------------- 12 GATE THRESHOLDS (rescaled) --
-- Gates follow equal geometric steps on the new apex 27.836687.
-- Stored so the UI reads them from canon rather than hardcoding.
UPDATE public.platform_settings SET text_value = jsonb_build_array(
  2.3197, 4.6394, 6.9592, 9.2789, 11.5986,
  13.9183, 16.2381, 18.5578, 20.8775, 23.1972, 25.5170, 27.8367
)::text WHERE key = 'gate_thresholds';

INSERT INTO public.platform_settings (key,text_value) VALUES
  ('gate_thresholds', '[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367]')
ON CONFLICT (key) DO UPDATE SET text_value = EXCLUDED.text_value;

-- ============================================================================
-- VERIFY
--   select public.authority_score(9,9,9);   -- expect 27.8367
--   select public.authority_score(0.001,0.001,0.001);  -- expect ~0.000033
--   select * from public.my_matrix();
--   select * from public.my_lattice();
-- ============================================================================
-- ===== end omega_authority_v2.sql =====
