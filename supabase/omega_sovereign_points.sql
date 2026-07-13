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
