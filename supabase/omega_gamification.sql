-- Gamification System Phase 2: Quest Management, Character Progression, Cosmetics Shop
-- Schema: 5 tables (quests, characters, cosmetic_items, cosmetic_purchases, progression)
--         6 RPC functions (complete_quest, create_quest, equip_cosmetic, unequip_cosmetic, get_leaderboard, get_character_or_create)
--         1 platform_settings flag (gamification_enabled, default false)

-- ============================================================================
-- TABLE: quests
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 100,
  element_theme TEXT NOT NULL,
  is_user_generated BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT description_not_empty CHECK (length(trim(description)) > 0),
  CONSTRAINT difficulty_valid CHECK (difficulty >= 1 AND difficulty <= 5),
  CONSTRAINT xp_positive CHECK (xp_reward > 0)
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Platform owner has full read/write access
CREATE POLICY "quests_platform_owner_full" ON public.quests
  FOR ALL USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Users can select active quests or their own quests (active or inactive)
CREATE POLICY "quests_select_active_or_own" ON public.quests
  FOR SELECT USING (is_active = true OR auth.uid() = created_by);

-- Users can insert only user-generated quests they author
CREATE POLICY "quests_insert_own_user_generated" ON public.quests
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND is_user_generated = true
    AND is_active = true
  );

-- Users can update only their own user-generated quests
CREATE POLICY "quests_update_own_user_generated" ON public.quests
  FOR UPDATE USING (auth.uid() = created_by AND is_user_generated = true)
  WITH CHECK (auth.uid() = created_by AND is_user_generated = true);

-- ============================================================================
-- TABLE: characters
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  element TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  cosmetics_equipped JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT level_valid CHECK (level >= 1 AND level <= 100),
  CONSTRAINT xp_non_negative CHECK (xp >= 0)
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Platform owner has full access
CREATE POLICY "characters_platform_owner_full" ON public.characters
  FOR ALL USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Users can read own character and all characters for leaderboard
CREATE POLICY "characters_select_own_and_public" ON public.characters
  FOR SELECT USING (true);

-- Users can insert their own character only once
CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update only their own character
CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: cosmetic_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cosmetic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  element TEXT,
  price_cents INT NOT NULL,
  min_tier INT NOT NULL DEFAULT 2,
  asset_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT description_not_empty CHECK (length(trim(description)) > 0),
  CONSTRAINT type_not_empty CHECK (length(trim(type)) > 0),
  CONSTRAINT price_positive CHECK (price_cents > 0),
  CONSTRAINT min_tier_valid CHECK (min_tier >= 1 AND min_tier <= 9)
);

ALTER TABLE public.cosmetic_items ENABLE ROW LEVEL SECURITY;

-- Platform owner has full access
CREATE POLICY "cosmetic_items_platform_owner_full" ON public.cosmetic_items
  FOR ALL USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Users can only see active cosmetics
CREATE POLICY "cosmetic_items_select_active" ON public.cosmetic_items
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- TABLE: cosmetic_purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cosmetic_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetic_items(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount_cents INT NOT NULL,
  platform_fee_cents INT NOT NULL,
  member_receives_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  purchased_at TIMESTAMP DEFAULT now(),
  CONSTRAINT amount_positive CHECK (amount_cents > 0),
  CONSTRAINT fee_calculation CHECK (platform_fee_cents = floor(amount_cents * 0.30)),
  CONSTRAINT member_receive_calculation CHECK (member_receives_cents = amount_cents - platform_fee_cents),
  CONSTRAINT status_valid CHECK (status IN ('completed', 'failed', 'pending'))
);

ALTER TABLE public.cosmetic_purchases ENABLE ROW LEVEL SECURITY;

-- Platform owner has full read/write access (for refunds, audits)
CREATE POLICY "cosmetic_purchases_platform_owner_full" ON public.cosmetic_purchases
  FOR ALL USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Users can only read their own purchases
CREATE POLICY "cosmetic_purchases_select_own" ON public.cosmetic_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Insert is blocked to client RLS; only Edge Function + service_role can write via webhook
CREATE POLICY "cosmetic_purchases_insert_blocked" ON public.cosmetic_purchases
  FOR INSERT WITH CHECK (false);

-- ============================================================================
-- TABLE: progression
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  quests_completed INT NOT NULL DEFAULT 0,
  total_xp INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_quest_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT quest_count_non_negative CHECK (quests_completed >= 0),
  CONSTRAINT xp_non_negative CHECK (total_xp >= 0),
  CONSTRAINT streak_non_negative CHECK (current_streak >= 0 AND longest_streak >= 0)
);

ALTER TABLE public.progression ENABLE ROW LEVEL SECURITY;

-- Platform owner has full access
CREATE POLICY "progression_platform_owner_full" ON public.progression
  FOR ALL USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- Users can read own progression and all progressions for leaderboard
CREATE POLICY "progression_select_all" ON public.progression
  FOR SELECT USING (true);

-- Update is blocked to client RLS; only complete_quest RPC can write
CREATE POLICY "progression_update_blocked" ON public.progression
  FOR UPDATE USING (false)
  WITH CHECK (false);

-- ============================================================================
-- RPC: complete_quest
-- Atomically updates progression, characters, and custom event trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_quest(
  p_user_id UUID,
  p_quest_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_quest RECORD;
  v_progression RECORD;
  v_character RECORD;
  v_new_xp INT;
  v_new_level INT;
BEGIN
  -- Verify quest exists and is active
  SELECT * INTO v_quest FROM public.quests WHERE id = p_quest_id AND is_active = true;
  IF v_quest IS NULL THEN
    RAISE EXCEPTION 'Quest not found or inactive';
  END IF;

  -- Verify user has character
  SELECT * INTO v_character FROM public.characters WHERE user_id = p_user_id;
  IF v_character IS NULL THEN
    RAISE EXCEPTION 'Character not found for user';
  END IF;

  -- Get current progression
  SELECT * INTO v_progression FROM public.progression WHERE user_id = p_user_id;
  IF v_progression IS NULL THEN
    INSERT INTO public.progression (user_id) VALUES (p_user_id)
    RETURNING * INTO v_progression;
  END IF;

  -- Calculate new XP and level
  v_new_xp := v_character.xp + v_quest.xp_reward;
  v_new_level := FLOOR(v_new_xp / 100) + 1;

  -- Update character
  UPDATE public.characters
  SET xp = v_new_xp, level = v_new_level, updated_at = now()
  WHERE user_id = p_user_id;

  -- Update progression
  UPDATE public.progression
  SET
    quests_completed = quests_completed + 1,
    total_xp = total_xp + v_quest.xp_reward,
    current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    last_quest_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'xp_earned', v_quest.xp_reward,
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'character_id', v_character.id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: create_quest
-- Creates a user-generated quest
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_quest(
  p_title TEXT,
  p_description TEXT,
  p_difficulty INT,
  p_xp_reward INT,
  p_element_theme TEXT
)
RETURNS JSON AS $$
DECLARE
  v_quest_id UUID;
BEGIN
  IF length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Title cannot be empty';
  END IF;
  IF length(trim(p_description)) = 0 THEN
    RAISE EXCEPTION 'Description cannot be empty';
  END IF;
  IF p_difficulty < 1 OR p_difficulty > 5 THEN
    RAISE EXCEPTION 'Difficulty must be 1-5';
  END IF;
  IF p_xp_reward <= 0 THEN
    RAISE EXCEPTION 'XP reward must be positive';
  END IF;

  INSERT INTO public.quests (
    created_by, title, description, difficulty, xp_reward, element_theme, is_user_generated, is_active
  ) VALUES (
    auth.uid(), p_title, p_description, p_difficulty, p_xp_reward, p_element_theme, true, true
  )
  RETURNING id INTO v_quest_id;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'quest_id', v_quest_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: equip_cosmetic
-- Adds a cosmetic to character's equipped list
-- ============================================================================
CREATE OR REPLACE FUNCTION public.equip_cosmetic(
  p_user_id UUID,
  p_cosmetic_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_cosmetic RECORD;
  v_character RECORD;
BEGIN
  -- Verify cosmetic exists and is active
  SELECT * INTO v_cosmetic FROM public.cosmetic_items WHERE id = p_cosmetic_id AND is_active = true;
  IF v_cosmetic IS NULL THEN
    RAISE EXCEPTION 'Cosmetic not found or inactive';
  END IF;

  -- Verify character exists
  SELECT * INTO v_character FROM public.characters WHERE user_id = p_user_id;
  IF v_character IS NULL THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  -- Verify user has purchased or has access to cosmetic (would be tier-gated in app logic)
  -- For now, just update equipped
  UPDATE public.characters
  SET cosmetics_equipped = COALESCE(cosmetics_equipped, '{}'::JSONB) ||
      JSONB_BUILD_OBJECT(v_cosmetic.type, p_cosmetic_id),
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'cosmetic_id', p_cosmetic_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: unequip_cosmetic
-- Removes a cosmetic from character's equipped list
-- ============================================================================
CREATE OR REPLACE FUNCTION public.unequip_cosmetic(
  p_user_id UUID,
  p_cosmetic_type TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.characters
  SET cosmetics_equipped = cosmetics_equipped - p_cosmetic_type,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'cosmetic_type', p_cosmetic_type
  );
EXCEPTION WHEN OTHERS THEN
  RETURN JSON_BUILD_OBJECT(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: get_leaderboard
-- Returns top characters by level and XP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_limit INT DEFAULT 10
)
RETURNS TABLE(rank INT, user_id UUID, name TEXT, element TEXT, level INT, total_xp INT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY c.level DESC, p.total_xp DESC)::INT,
    c.user_id,
    c.name,
    c.element,
    c.level,
    p.total_xp
  FROM public.characters c
  LEFT JOIN public.progression p ON c.user_id = p.user_id
  ORDER BY c.level DESC, p.total_xp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: get_character_or_create
-- Returns user's character or creates one if missing
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_character_or_create(
  p_user_id UUID,
  p_name TEXT DEFAULT NULL,
  p_element TEXT DEFAULT 'fire'
)
RETURNS TABLE(id UUID, user_id UUID, name TEXT, element TEXT, level INT, xp INT, cosmetics_equipped JSONB) AS $$
DECLARE
  v_character RECORD;
BEGIN
  -- Try to get existing character
  SELECT * INTO v_character FROM public.characters WHERE user_id = p_user_id;

  IF v_character IS NULL THEN
    -- Create new character
    INSERT INTO public.characters (user_id, name, element)
    VALUES (p_user_id, COALESCE(p_name, 'Wanderer'), p_element)
    RETURNING * INTO v_character;

    -- Create progression record
    INSERT INTO public.progression (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_character.id, v_character.user_id, v_character.name,
                     v_character.element, v_character.level, v_character.xp, v_character.cosmetics_equipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PLATFORM SETTING: gamification_enabled
-- ============================================================================
INSERT INTO public.platform_settings (key, bool_value)
VALUES ('gamification_enabled', false)
ON CONFLICT (key) DO NOTHING;
