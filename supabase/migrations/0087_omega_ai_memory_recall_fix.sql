-- ============================================================================
-- SYD OMEGA 91717 -- AI MEMORY RECALL FIX
-- recall_ai_context() (omega_ai_memory.sql) never checked ai_memory.expires_at
-- at all -- a member's memories marked to expire were still returned forever,
-- defeating the purpose of the column. This is a correctness fix, not a
-- "smarter AI" claim: true semantic ranking via the already-declared
-- `embedding vector(384)` column needs an embeddings provider (Anthropic has
-- none; Voyage AI is Anthropic's own recommended partner) and a
-- VOYAGE_API_KEY secret this deployment doesn't have -- left dormant and
-- documented, not faked with a placeholder distance calculation.
-- Run AFTER omega_ai_memory.sql. Safe + re-runnable.
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.recall_ai_context(p_limit int DEFAULT 8)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE
  _uid uuid := auth.uid();
  _mems jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT jsonb_agg(jsonb_build_object('key',memory_key,'type',memory_type,'content',content,'ts',updated_at))
    INTO _mems
  FROM (
    SELECT * FROM public.ai_memory
    WHERE user_id=_uid
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY updated_at DESC LIMIT p_limit
  ) t;
  RETURN jsonb_build_object('ok',true,'memories',COALESCE(_mems,'[]'::jsonb));
END;
$$;
GRANT EXECUTE ON FUNCTION public.recall_ai_context(int) TO authenticated;

COMMIT;
