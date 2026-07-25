-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 07 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
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
CREATE OR REPLACE FUNCTION public.trial_length() RETURNS interval
  LANGUAGE sql IMMUTABLE AS $$ SELECT (9.1717 * interval '1 minute') $$;

-- APPROVE -- grants the 9.1717-minute sovereign trial ------------------------
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
CREATE OR REPLACE FUNCTION public.reactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  UPDATE public.profiles SET deactivated_at = NULL WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'reactivated',true);
END;
$$;

-- DELETE -- permanent erasure of the caller's own data (right-to-delete) -----
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
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
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
