-- CHUNK 02b/09


-- 5) complete_task -- now lights the 12 curated milestones per track ---------
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
CREATE OR REPLACE FUNCTION public.get_platform_flag(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT bool_value FROM public.platform_settings WHERE key=p_key), false);
$$;

-- flip a flag (FOUNDER ONLY -- this is how payments get switched on) ----------
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
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

COMMIT;
