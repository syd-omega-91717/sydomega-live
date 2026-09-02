-- SYD OMEGA 91717 — runtime schema alignment
-- Aligns the live database with the production browser clients without
-- removing legacy columns or changing existing user data.
BEGIN;

ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS expires_at timestamptz;
UPDATE public.ai_memory SET content = memory WHERE content IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ai_memory_user_memory_key_uidx
  ON public.ai_memory(user_id, memory_key)
  WHERE user_id IS NOT NULL AND memory_key IS NOT NULL;

GRANT INSERT ON public.platform_events TO authenticated;
DROP POLICY IF EXISTS "member inserts own events" ON public.platform_events;
CREATE POLICY "member inserts own events"
  ON public.platform_events
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.recall_ai_context(p_limit int DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE
  _uid uuid := auth.uid();
  _mems jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT jsonb_agg(jsonb_build_object(
    'key',memory_key,
    'type',memory_type,
    'content',coalesce(content,memory),
    'ts',updated_at
  )) INTO _mems
  FROM (
    SELECT * FROM public.ai_memory
    WHERE user_id=_uid
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY updated_at DESC
    LIMIT greatest(1, least(coalesce(p_limit,8),100))
  ) t;
  RETURN jsonb_build_object('ok',true,'memories',coalesce(_mems,'[]'::jsonb));
END;
$$;
GRANT EXECUTE ON FUNCTION public.recall_ai_context(int) TO authenticated;

COMMIT;
