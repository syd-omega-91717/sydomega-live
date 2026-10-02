-- FILE: supabase/migrations/20261002180500_member_preferences_persistence_20261002.sql
-- Persist the member experience settings that were previously cosmetic/local-only.
-- The row is owned by the authenticated member; no client may write another user's state.

CREATE TABLE IF NOT EXISTS public.member_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dark_mode boolean NOT NULL DEFAULT true,
  compact_layout boolean NOT NULL DEFAULT false,
  animations boolean NOT NULL DEFAULT true,
  cursor_trail boolean NOT NULL DEFAULT true,
  anonymous_mode boolean NOT NULL DEFAULT false,
  matrix_milestone_alerts boolean NOT NULL DEFAULT true,
  agent_messages boolean NOT NULL DEFAULT true,
  daily_oracle boolean NOT NULL DEFAULT true,
  economic_events boolean NOT NULL DEFAULT false,
  ambient_frequency boolean NOT NULL DEFAULT true,
  click_sounds boolean NOT NULL DEFAULT false,
  oracle_voice boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_preferences_select_own" ON public.member_preferences;
CREATE POLICY "member_preferences_select_own"
  ON public.member_preferences
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "member_preferences_insert_own" ON public.member_preferences;
CREATE POLICY "member_preferences_insert_own"
  ON public.member_preferences
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "member_preferences_update_own" ON public.member_preferences;
CREATE POLICY "member_preferences_update_own"
  ON public.member_preferences
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.get_member_preferences()
RETURNS public.member_preferences
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT mp.*
  FROM public.member_preferences AS mp
  WHERE mp.user_id = (select auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_member_preferences(
  p_dark_mode boolean DEFAULT NULL,
  p_compact_layout boolean DEFAULT NULL,
  p_animations boolean DEFAULT NULL,
  p_cursor_trail boolean DEFAULT NULL,
  p_anonymous_mode boolean DEFAULT NULL,
  p_matrix_milestone_alerts boolean DEFAULT NULL,
  p_agent_messages boolean DEFAULT NULL,
  p_daily_oracle boolean DEFAULT NULL,
  p_economic_events boolean DEFAULT NULL,
  p_ambient_frequency boolean DEFAULT NULL,
  p_click_sounds boolean DEFAULT NULL,
  p_oracle_voice boolean DEFAULT NULL
)
RETURNS public.member_preferences
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (select auth.uid());
  v_row public.member_preferences;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authenticated session required'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.member_preferences (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.member_preferences
  SET
    dark_mode = COALESCE(p_dark_mode, dark_mode),
    compact_layout = COALESCE(p_compact_layout, compact_layout),
    animations = COALESCE(p_animations, animations),
    cursor_trail = COALESCE(p_cursor_trail, cursor_trail),
    anonymous_mode = COALESCE(p_anonymous_mode, anonymous_mode),
    matrix_milestone_alerts = COALESCE(p_matrix_milestone_alerts, matrix_milestone_alerts),
    agent_messages = COALESCE(p_agent_messages, agent_messages),
    daily_oracle = COALESCE(p_daily_oracle, daily_oracle),
    economic_events = COALESCE(p_economic_events, economic_events),
    ambient_frequency = COALESCE(p_ambient_frequency, ambient_frequency),
    click_sounds = COALESCE(p_click_sounds, click_sounds),
    oracle_voice = COALESCE(p_oracle_voice, oracle_voice),
    updated_at = now()
  WHERE user_id = v_uid
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT SELECT ON public.member_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_preferences(
  boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) TO authenticated;

REVOKE ALL ON FUNCTION public.get_member_preferences() FROM anon;
REVOKE ALL ON FUNCTION public.set_member_preferences(
  boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) FROM anon;

CREATE INDEX IF NOT EXISTS idx_member_preferences_updated_at
  ON public.member_preferences(updated_at DESC);

COMMENT ON TABLE public.member_preferences IS
  'Persistent member experience preferences; member-owned and RLS protected.';
