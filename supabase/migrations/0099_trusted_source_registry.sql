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
