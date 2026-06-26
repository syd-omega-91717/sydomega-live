BEGIN;

-- ==========================================================
-- AI PROVIDERS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_providers (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT UNIQUE NOT NULL,

    name TEXT NOT NULL,

    enabled BOOLEAN DEFAULT TRUE,

    endpoint TEXT,

    model TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- AI AGENTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_agents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    provider_id UUID REFERENCES public.ai_providers(id),

    name TEXT NOT NULL,

    description TEXT,

    system_prompt TEXT,

    avatar TEXT,

    visibility TEXT DEFAULT 'private',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- AI CONVERSATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    agent_id UUID REFERENCES public.ai_agents(id),

    title TEXT,

    provider TEXT,

    model TEXT,

    total_tokens INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- AI MESSAGES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_messages (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,

    role TEXT NOT NULL,

    content TEXT NOT NULL,

    token_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- PROMPT LIBRARY
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_prompts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id),

    title TEXT NOT NULL,

    category TEXT,

    prompt TEXT NOT NULL,

    favorite BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- KNOWLEDGE BASE
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_documents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id),

    title TEXT,

    file_path TEXT,

    content TEXT,

    embedding_status TEXT DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- AI EXECUTIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ai_jobs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id),

    provider TEXT,

    model TEXT,

    prompt_tokens INTEGER DEFAULT 0,

    completion_tokens INTEGER DEFAULT 0,

    total_tokens INTEGER DEFAULT 0,

    duration_ms INTEGER DEFAULT 0,

    status TEXT DEFAULT 'completed',

    created_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
