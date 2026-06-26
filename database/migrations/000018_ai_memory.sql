BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_memory (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,

    importance INTEGER DEFAULT 1,

    category TEXT,

    memory TEXT NOT NULL,

    embedding_status TEXT DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.ai_memory_links (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    memory_id UUID REFERENCES public.ai_memory(id) ON DELETE CASCADE,

    entity_type TEXT,

    entity_id TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_ai_memory_owner

ON public.ai_memory(owner_id);

CREATE INDEX IF NOT EXISTS idx_ai_memory_conversation

ON public.ai_memory(conversation_id);

COMMIT;
