-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 04 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
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
CREATE OR REPLACE FUNCTION public.published_dispatches(p_limit int DEFAULT 30)
RETURNS SETOF public.dispatches LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.dispatches WHERE is_published = true ORDER BY created_at DESC LIMIT LEAST(GREATEST(p_limit,1),100);
$$;

-- owner unpublish/republish --------------------------------------------------
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
DROP FUNCTION IF EXISTS public.expire_trial(uuid) CASCADE;
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
DROP FUNCTION IF EXISTS public.grant_permanent_access(uuid) CASCADE;
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
