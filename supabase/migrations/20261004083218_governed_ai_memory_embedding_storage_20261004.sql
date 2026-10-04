CREATE TABLE IF NOT EXISTS public.ai_memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.ai_memory(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_code text NOT NULL,
  model text NOT NULL,
  model_version text NOT NULL,
  dimensions integer CHECK (dimensions IS NULL OR dimensions > 0),
  embedding extensions.vector,
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed','unavailable')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(memory_id, provider_code, model, model_version)
);

CREATE INDEX IF NOT EXISTS ai_memory_embeddings_user_status_idx ON public.ai_memory_embeddings(user_id,status);
CREATE INDEX IF NOT EXISTS ai_memory_embeddings_memory_idx ON public.ai_memory_embeddings(memory_id);

ALTER TABLE public.ai_memory_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_memory_embeddings_select ON public.ai_memory_embeddings;
CREATE POLICY ai_memory_embeddings_select ON public.ai_memory_embeddings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_memory m WHERE m.id=ai_memory_embeddings.memory_id AND m.user_id=(SELECT auth.uid()))
  OR private.is_platform_owner()
);

DROP POLICY IF EXISTS ai_memory_embeddings_insert ON public.ai_memory_embeddings;
CREATE POLICY ai_memory_embeddings_insert ON public.ai_memory_embeddings FOR INSERT WITH CHECK (
  user_id=(SELECT auth.uid())
  AND EXISTS (SELECT 1 FROM public.ai_memory m WHERE m.id=ai_memory_embeddings.memory_id AND m.user_id=(SELECT auth.uid()))
);

DROP POLICY IF EXISTS ai_memory_embeddings_update ON public.ai_memory_embeddings;
CREATE POLICY ai_memory_embeddings_update ON public.ai_memory_embeddings FOR UPDATE USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));

DROP POLICY IF EXISTS ai_memory_embeddings_delete ON public.ai_memory_embeddings;
CREATE POLICY ai_memory_embeddings_delete ON public.ai_memory_embeddings FOR DELETE USING (user_id=(SELECT auth.uid()));

-- (2026-10-04, owner-approved) Live ai_memory carries a legacy `memory` column
-- (added out-of-band) that the chain never adds; the backfill below reads it,
-- so a fresh `supabase db reset` failed here. A no-op live.
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS memory text;

INSERT INTO public.ai_memory_embeddings (memory_id,user_id,provider_code,model,model_version,dimensions,content_hash,status)
SELECT m.id,m.user_id,'UNSELECTED','UNSELECTED','UNSELECTED',NULL,md5(coalesce(m.content,m.memory,'')),'pending'
FROM public.ai_memory m
WHERE NOT EXISTS (SELECT 1 FROM public.ai_memory_embeddings e WHERE e.memory_id=m.id);
