-- REPLAY PRELUDE (added 2026-10-06, not part of what ran live).
-- Live public.omega_platform_evidence is a legacy table created outside any
-- migration; 20261002025000's CREATE TABLE IF NOT EXISTS was skipped live and
-- only ALTERed it. The view below reads those legacy columns, so a database
-- built from migrations alone lacked them (42703 on e.id in the full replay).
-- Every statement is ADD COLUMN IF NOT EXISTS: a no-op live, where all eight
-- exist (pg_attribute, 2026-10-06). Live also holds NOT NULL on capability_id,
-- evidence_level, check_name and result with no default; that is left off here
-- so later migrations' inserts that predate these columns still replay.
alter table public.omega_platform_evidence
  add column if not exists id uuid not null default gen_random_uuid(),
  add column if not exists capability_id text,
  add column if not exists evidence_level text,
  add column if not exists check_name text,
  add column if not exists result text,
  add column if not exists evidence jsonb not null default '{}'::jsonb,
  add column if not exists commit_sha text,
  add column if not exists workflow_run_id text;

create or replace view public.omega_member_knowledge_loom
with (security_invoker = true)
as
select d.id as source_id,'knowledge_document'::text as source_kind,d.title as title,coalesce(nullif(d.summary,''),left(coalesce(d.body,''),700)) as excerpt,'USER_CREATED'::text as truth_state,coalesce(d.slug,d.id::text) as source_ref,d.updated_at as observed_at,(d.status='published') as verified,jsonb_build_object('category',d.category,'tags',coalesce(d.tags,'{}'::text[]),'status',d.status,'version',d.version) as metadata
from public.knowledge_documents d where d.author_id=(select auth.uid())
union all
select m.id,'ai_memory'::text,coalesce(nullif(m.memory_key,''),'AI MEMORY'),left(coalesce(nullif(m.content,''),m.memory,''),700),'CALCULATED'::text,coalesce(m.memory_key,m.id::text),m.updated_at,false,jsonb_build_object('memory_type',m.memory_type,'agent_name',m.agent_name,'expires_at',m.expires_at)
from public.ai_memory m where m.user_id=(select auth.uid())
union all
select g.id,'graph_evidence'::text,coalesce(nullif(g.source_type,''),'GRAPH EVIDENCE'),left(coalesce(g.extracted_text,''),700),case when g.human_verified then 'VERIFIED' else 'UNVERIFIED' end,coalesce(g.source_url,g.source_row_id::text,g.id::text),coalesce(g.extraction_timestamp,now()),coalesce(g.human_verified,false),jsonb_build_object('source_table',g.source_table,'extraction_confidence',g.extraction_confidence,'extraction_method',g.extraction_method,'ai_model_used',g.ai_model_used,'graph_entity_id',g.graph_entity_id,'graph_relationship_id',g.graph_relationship_id)
from public.graph_evidence g where g.user_id=(select auth.uid())
union all
select e.id,'platform_evidence'::text,coalesce(nullif(e.check_name,''),nullif(e.evidence_type,''),'PLATFORM EVIDENCE'),left(coalesce(cast(e.evidence as text),''),700),case when e.status='verified' or e.verified_at is not null then 'VERIFIED' else 'LIVE' end,coalesce(e.uri,e.commit_sha,e.workflow_run_id::text,e.id::text),coalesce(e.verified_at,e.recorded_at,now()),(e.status='verified' or e.verified_at is not null),jsonb_build_object('capability_id',e.capability_id,'evidence_level',e.evidence_level,'evidence_type',e.evidence_type,'source',e.source,'subject_type',e.subject_type,'subject_id',e.subject_id,'commit_sha',e.commit_sha,'workflow_run_id',e.workflow_run_id)
from public.omega_platform_evidence e where e.owner_user_id=(select auth.uid());
grant select on public.omega_member_knowledge_loom to authenticated;
comment on view public.omega_member_knowledge_loom is 'Member-scoped provenance-first Knowledge Loom. SECURITY INVOKER; reads canonical knowledge, memory and evidence sources only. No synthetic records.';
