-- Ω SYD OMEGA 91717 — Knowledge Loom evidence identity reconciliation
-- Fresh replay uses evidence_id as the canonical platform-evidence primary key.
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
select e.evidence_id,'platform_evidence'::text,coalesce(nullif(e.check_name,''),nullif(e.evidence_type,''),'PLATFORM EVIDENCE'),left(coalesce(cast(e.evidence as text),''),700),case when e.status='verified' or e.verified_at is not null then 'VERIFIED' else 'LIVE' end,coalesce(e.uri,e.commit_sha,e.workflow_run_id::text,e.evidence_id::text),coalesce(e.verified_at,e.recorded_at,now()),(e.status='verified' or e.verified_at is not null),jsonb_build_object('capability_id',e.capability_id,'evidence_level',e.evidence_level,'evidence_type',e.evidence_type,'source',e.source,'subject_type',e.subject_type,'subject_id',e.subject_id,'commit_sha',e.commit_sha,'workflow_run_id',e.workflow_run_id)
from public.omega_platform_evidence e where e.owner_user_id=(select auth.uid());
grant select on public.omega_member_knowledge_loom to authenticated;