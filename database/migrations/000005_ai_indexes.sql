CREATE INDEX IF NOT EXISTS idx_ai_agents_owner
ON public.ai_agents(owner_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_owner
ON public.ai_conversations(owner_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
ON public.ai_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_owner
ON public.ai_jobs(owner_id);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_owner
ON public.ai_prompts(owner_id);

CREATE INDEX IF NOT EXISTS idx_ai_documents_owner
ON public.ai_documents(owner_id);
