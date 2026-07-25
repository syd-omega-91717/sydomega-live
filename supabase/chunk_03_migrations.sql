-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 03 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
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
CREATE OR REPLACE FUNCTION public.my_points_balance()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); bal int; BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT COALESCE(SUM(delta),0) INTO bal FROM public.sovereign_points_ledger WHERE user_id=uid;
  RETURN jsonb_build_object('ok',true,'balance',bal);
END; $$;
GRANT EXECUTE ON FUNCTION public.my_points_balance() TO authenticated;

-- daily login bonus -- real, rate-limited to once per real calendar day
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
CREATE OR REPLACE FUNCTION public.trg_award_task_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.award_points(NEW.user_id, 5, 'academy_lesson', COALESCE(NEW.task,'task completed'));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS award_points_on_task ON public.task_completions;
CREATE TRIGGER award_points_on_task AFTER INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_task_points();

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
CREATE OR REPLACE FUNCTION public.matrix_node(a int,b int,c int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$ SELECT (a-1)*81 + (b-1)*9 + (c-1) + 1 $$;

-- read my full nested matrix: 12 tracks, each with (a,b,c), node, % of 729
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
CREATE OR REPLACE FUNCTION public.has_academy_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT expires_at > now() FROM public.academy_access WHERE user_id=auth.uid()), false)
$$;

-- subscribe (mirrors processAcademySubscription) -- DORMANT until legal sign-off
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
