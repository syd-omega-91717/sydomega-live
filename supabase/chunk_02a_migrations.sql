-- CHUNK 02a/09
-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 02 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
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
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = true WHERE id = p_uid;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'access_approved', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles SET access_approved = false WHERE id = p_uid;
  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'access_approved', false);
END;
$$;

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
CREATE OR REPLACE FUNCTION public.milestones_for_axis(v numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, LEAST(12, floor((COALESCE(v,1) - 1) / 8.0 * 12)::int));
$$;
