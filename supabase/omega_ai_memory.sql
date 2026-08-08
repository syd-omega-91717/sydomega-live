-- ============================================================================
-- Ω SYD OMEGA 91717 — AI MEMORY PERSISTENCE LAYER
-- Stores AI agent memories, conversation history, member preferences
-- Enables: personalised responses, cross-session continuity, GDPR-compliant
-- ============================================================================

-- ── AI MEMORY STORE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_memory(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memory_key   text        NOT NULL,
  memory_type  text        NOT NULL DEFAULT 'semantic',
  content      text        NOT NULL,
  embedding    vector(384),            -- pgvector for semantic recall (optional)
  confidence   numeric(4,3) DEFAULT 1.0,
  source       text        DEFAULT 'system',  -- 'system','member','agent'
  agent_name   text,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, memory_key),
  CONSTRAINT mem_type_ck CHECK(memory_type IN('semantic','episodic','procedural','conversation','declarative'))
);
-- Guarantee these columns exist even if public.ai_memory already exists in a
-- divergent shape (e.g. created out-of-band, predating this file), in which
-- case the CREATE TABLE above was skipped and the indexes/policies below
-- would fail -- same defensive pattern as omega_master_deploy.sql's
-- "guarantee the ownership column exists first" comment.
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS user_id     uuid;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS memory_key  text;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS memory_type text NOT NULL DEFAULT 'semantic';
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS agent_name  text;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_mem_user   ON public.ai_memory(user_id, memory_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mem_key    ON public.ai_memory(user_id, memory_key);
CREATE INDEX IF NOT EXISTS idx_mem_agent  ON public.ai_memory(agent_name, user_id);
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member reads own memory" ON public.ai_memory;
CREATE POLICY "member reads own memory" ON public.ai_memory FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "member writes own memory" ON public.ai_memory;
CREATE POLICY "member writes own memory" ON public.ai_memory
  FOR ALL USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "owner reads all memory" ON public.ai_memory;
CREATE POLICY "owner reads all memory" ON public.ai_memory FOR SELECT USING(public.is_platform_owner());

-- ── AGENT CONVERSATION THREADS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_threads(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_name   text        NOT NULL,
  thread_id    text        NOT NULL,
  messages     jsonb       NOT NULL DEFAULT '[]',
  summary      text,
  message_count int        DEFAULT 0,
  last_query   text,
  last_response text,
  quality_score numeric(4,3),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, thread_id)
);
CREATE INDEX IF NOT EXISTS idx_thread_user  ON public.agent_threads(user_id, agent_name, updated_at DESC);
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member reads own threads" ON public.agent_threads;
CREATE POLICY "member reads own threads" ON public.agent_threads
  FOR ALL USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

-- ── ERASE MEMORY RPC (GDPR Art. 17) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.erase_ai_memory()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  DELETE FROM public.ai_memory WHERE user_id=_uid;
  DELETE FROM public.agent_threads WHERE user_id=_uid;
  INSERT INTO public.sovereign_events(user_id,event_type,event_data,occurred_at)
  VALUES(_uid,'ai.memory_erased',jsonb_build_object('erased_at',now()),now());
  RETURN jsonb_build_object('ok',true,'message','All AI memories erased per GDPR Article 17.');
END;
$$;
GRANT EXECUTE ON FUNCTION public.erase_ai_memory() TO authenticated;

-- ── RECALL CONTEXT RPC ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recall_ai_context(p_limit int DEFAULT 8)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
DECLARE
  _uid uuid := auth.uid();
  _mems jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  SELECT jsonb_agg(jsonb_build_object('key',memory_key,'type',memory_type,'content',content,'ts',updated_at))
    INTO _mems
  FROM (SELECT * FROM public.ai_memory WHERE user_id=_uid ORDER BY updated_at DESC LIMIT p_limit) t;
  RETURN jsonb_build_object('ok',true,'memories',COALESCE(_mems,'[]'::jsonb));
END;
$$;
GRANT EXECUTE ON FUNCTION public.recall_ai_context(int) TO authenticated;

-- ── AUTO-UPDATE timestamp ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_ai_memory()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trig_touch_mem ON public.ai_memory;
CREATE TRIGGER trig_touch_mem BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.touch_ai_memory();
