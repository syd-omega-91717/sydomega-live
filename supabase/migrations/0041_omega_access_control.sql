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
