-- Canonical table bootstrap. The production table existed before this registry seed
-- was versioned, which made a fresh migration replay non-reproducible.
CREATE TABLE IF NOT EXISTS public.omega_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_url text,
  title text NOT NULL,
  publisher text,
  author text,
  published_at timestamptz,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  license text,
  source_type text NOT NULL DEFAULT 'public',
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_score numeric,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS omega_knowledge_sources_url_uq
  ON public.omega_knowledge_sources(canonical_url)
  WHERE canonical_url IS NOT NULL;
ALTER TABLE public.omega_knowledge_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS omega_deny_by_default ON public.omega_knowledge_sources;
CREATE POLICY omega_deny_by_default
  ON public.omega_knowledge_sources
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- SYD OMEGA 91717 trusted engineering source registry
-- Idempotent reference data for the knowledge/provenance layer.
BEGIN;
INSERT INTO public.omega_knowledge_sources
  (canonical_url,title,publisher,license,source_type,provenance,quality_score,status)
SELECT * FROM (VALUES
  ('https://github.com/anthropics/skills','Agent Skills','Anthropic','Apache-2.0 / repository disclosures','official_github_repository','{"role":"agent-skills-standard-reference","trusted":true}'::jsonb,0.99,'approved'),
  ('https://github.com/agentskills/agentskills','Agent Skills Specification','Agent Skills','Apache-2.0','official_standard','{"role":"portable-skill-format","trusted":true}'::jsonb,0.99,'approved'),
  ('https://github.com/openai/openai-agents-python','OpenAI Agents SDK','OpenAI','MIT','official_github_repository','{"role":"agent-orchestration-reference","trusted":true}'::jsonb,0.99,'approved'),
  ('https://github.com/openai/openai-cookbook','OpenAI Cookbook','OpenAI','MIT','official_github_repository','{"role":"api-pattern-reference","trusted":true}'::jsonb,0.99,'approved'),
  ('https://github.com/google/adk-python','Google ADK','Google','Apache-2.0','official_github_repository','{"role":"agent-workflow-reference","trusted":true}'::jsonb,0.99,'approved'),
  ('https://github.com/google-gemini/cookbook','Gemini Cookbook','Google','Apache-2.0','official_github_repository','{"role":"multimodal-ai-reference","trusted":true}'::jsonb,0.99,'approved'),
  ('https://github.com/deepseek-ai/deepseek-harness','DeepSeek Harness','DeepSeek AI','MIT','official_github_repository','{"role":"plugin-harness-reference","trusted":true,"production_note":"developer_preview"}'::jsonb,0.97,'approved'),
  ('https://github.com/cursor/plugins','Cursor Plugins','Cursor','MIT','official_github_repository','{"role":"plugin-interoperability-reference","trusted":true}'::jsonb,0.97,'approved')
) s(canonical_url,title,publisher,license,source_type,provenance,quality_score,status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.omega_knowledge_sources x WHERE x.canonical_url=s.canonical_url
);
COMMIT;
