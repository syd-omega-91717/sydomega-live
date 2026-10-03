-- ============================================================================
-- SYD OMEGA 91717 -- QUEST SYSTEM FOUNDATION
-- Engagement multiplier: quest progression across 8 domains
--   Sentinel (Guardian's Seal): threat scanning
--   Merchant (Merchant's Ledger): transaction tracking
--   Scout (Scout's Trail): discovery collection
--   Warden (Guardian's Circle): family management
--   Sovereign (Sovereign's Charter): governance setup
--   Auditor (Auditor's Seal): validation workflow
--   Proxy (Executor's Path): task automation
--   Oracle (Oracle's Sight): forecasting
--
-- Quest tracking drives tier unlocks, badges, and engagement loop.
-- Idempotent: safe to re-run.
-- ============================================================================
BEGIN;

-- 1) quests table: catalog of all available quests -------------------------
CREATE TABLE IF NOT EXISTS public.quests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain          text NOT NULL,
  quest_key       text NOT NULL,
  title           text NOT NULL,
  description     text,
  reward_points   int DEFAULT 100,
  tier_unlock     int DEFAULT 1,
  icon_glyph      text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(domain, quest_key)
);
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quests_select_all ON public.quests;
CREATE POLICY quests_select_all ON public.quests FOR SELECT USING (true);

-- 2) quest_progress: user progression through quests -----------------------
CREATE TABLE IF NOT EXISTS public.quest_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id        uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress        numeric DEFAULT 0,
  target          numeric DEFAULT 100,
  status          text DEFAULT 'in_progress',
  started_at      timestamptz DEFAULT now(),
  completed_at    timestamptz,
  UNIQUE(user_id, quest_id)
);
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quest_progress_select_own ON public.quest_progress;
DROP POLICY IF EXISTS quest_progress_insert_own ON public.quest_progress;
DROP POLICY IF EXISTS quest_progress_update_own ON public.quest_progress;
CREATE POLICY quest_progress_select_own ON public.quest_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());
CREATE POLICY quest_progress_insert_own ON public.quest_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY quest_progress_update_own ON public.quest_progress FOR UPDATE
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- 3) quest_events: audit trail of quest completion moments ------------------
CREATE TABLE IF NOT EXISTS public.quest_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id        uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  event_type      text,
  metadata        jsonb,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.quest_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quest_events_select_own ON public.quest_events;
CREATE POLICY quest_events_select_own ON public.quest_events FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- 4) add quest tracking to profiles table -----------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quests_started      int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quests_completed    int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quest_points_earned int DEFAULT 0;

-- 5) insert core quests (8 domains x 1 primary quest each) ------------------
INSERT INTO public.quests (domain, quest_key, title, description, reward_points, tier_unlock, icon_glyph)
VALUES
  ('command', 'guardians_seal', 'Guardian''s Seal', 'Scan threat surface and resolve findings', 150, 2, '🛡️'),
  ('commerce', 'merchants_ledger', 'Merchant''s Ledger', 'Add transaction, categorize, reach goal', 150, 2, '💰'),
  ('discovery', 'scouts_trail', 'Scout''s Trail', 'Collect 5 discoveries and unlock badge', 100, 1, '🔍'),
  ('family', 'guardians_circle', 'Guardian''s Circle', 'Add 3 members and set privacy rules', 150, 2, '👥'),
  ('governance', 'sovereigns_charter', 'Sovereign''s Charter', 'Define 5 preferences and mission', 200, 3, '👑'),
  ('validation', 'auditors_seal', 'Auditor''s Seal', 'Complete validation feedback loop', 100, 2, '✓'),
  ('execution', 'executors_path', 'Executor''s Path', 'Complete 10 tasks and unlock automation', 200, 3, '⚡'),
  ('prophecy', 'oracles_sight', 'Oracle''s Sight', 'Generate 3 forecasts and validate 1', 150, 2, '🔮')
ON CONFLICT (domain, quest_key) DO NOTHING;

-- 6) function: start_quest() -----------------------------------------------
CREATE OR REPLACE FUNCTION public.start_quest(
  p_quest_key text,
  p_domain text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  qid uuid;
  prog_id uuid;
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not authenticated');
  END IF;

  -- Get quest ID
  SELECT id INTO qid FROM public.quests
  WHERE quest_key = p_quest_key AND domain = p_domain LIMIT 1;

  IF qid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'quest not found');
  END IF;

  -- Create progress entry if not exists
  INSERT INTO public.quest_progress (user_id, quest_id, status)
    VALUES (uid, qid, 'in_progress')
    ON CONFLICT (user_id, quest_id) DO UPDATE
      SET status = 'in_progress'
    RETURNING id INTO prog_id;

  -- Update profile counter
  UPDATE public.profiles
    SET quests_started = COALESCE(quests_started, 0) + 1
    WHERE id = uid AND NOT EXISTS (
      SELECT 1 FROM public.quest_progress
      WHERE user_id = uid AND quest_id = qid AND started_at < now() - interval '1 second'
    );

  RETURN jsonb_build_object('success', true, 'quest_id', qid, 'progress_id', prog_id);
END;
$$;

-- 7) function: update_quest_progress() ------------------------------------
CREATE OR REPLACE FUNCTION public.update_quest_progress(
  p_quest_id uuid,
  p_progress numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  target numeric;
  new_status text;
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not authenticated');
  END IF;

  -- Get target value for this quest
  SELECT (SELECT target FROM public.quest_progress
          WHERE user_id = uid AND quest_id = p_quest_id)
  INTO target;

  IF target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'quest not in progress');
  END IF;

  -- Determine new status
  new_status := CASE
    WHEN p_progress >= target THEN 'completed'
    ELSE 'in_progress'
  END;

  -- Update progress
  UPDATE public.quest_progress
    SET progress = p_progress,
        status = new_status,
        completed_at = CASE WHEN new_status = 'completed' THEN now() ELSE NULL END
    WHERE user_id = uid AND quest_id = p_quest_id;

  -- Award points if completed
  IF new_status = 'completed' THEN
    UPDATE public.profiles
      SET quest_points_earned = COALESCE(quest_points_earned, 0) +
          (SELECT reward_points FROM public.quests WHERE id = p_quest_id),
          quests_completed = COALESCE(quests_completed, 0) + 1
      WHERE id = uid;

    -- Log completion event
    INSERT INTO public.quest_events (user_id, quest_id, event_type, metadata)
      VALUES (uid, p_quest_id, 'completed', jsonb_build_object('points_awarded',
        (SELECT reward_points FROM public.quests WHERE id = p_quest_id)));
  END IF;

  RETURN jsonb_build_object('success', true, 'status', new_status, 'progress', p_progress);
END;
$$;

-- 8) function: get_active_quests() ----------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_quests()
RETURNS TABLE (
  quest_id uuid,
  domain text,
  title text,
  progress numeric,
  target numeric,
  status text,
  reward_points int,
  completion_pct numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.domain,
    q.title,
    COALESCE(qp.progress, 0),
    COALESCE(qp.target, 100),
    COALESCE(qp.status, 'not_started'),
    q.reward_points,
    ROUND(COALESCE(qp.progress, 0) / COALESCE(qp.target, 100) * 100, 0)
  FROM public.quests q
  LEFT JOIN public.quest_progress qp ON q.id = qp.quest_id AND qp.user_id = uid
  ORDER BY q.domain, q.title;
END;
$$;

-- 9) Grant permissions -------------------------------------------------------
GRANT SELECT ON public.quests TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.quest_progress TO authenticated;
GRANT SELECT, INSERT ON public.quest_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_quest(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_quest_progress(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_quests() TO authenticated;

COMMIT;

-- ============================================================================
