-- Ω SYD OMEGA 91717 — KNOWLEDGE LOOM REALITY READ MODEL
-- Member-scoped, provenance-first read model over canonical sources.
-- No new identity/event/evidence system is introduced here.

create or replace view public.omega_member_knowledge_loom
with (security_invoker = true)
as
select
  d.id as source_id,
  'knowledge_document'::text as source_kind,
  d.title as title,
  coalesce(nullif(d.summary,''), left(coalesce(d.body,''), 700)) as excerpt,
  'USER_CREATED'::text as truth_state,
  coalesce(d.slug, d.id::text) as source_ref,
  d.updated_at as observed_at,
  case when d.status = 'published' then true else false end as verified,
  jsonb_build_object(
    'category', d.category,
    'tags', coalesce(d.tags,'{}'::text[]),
    'status', d.status,
    'version', d.version
  ) as metadata
from public.knowledge_documents d
where d.author_id = (select auth.uid())

union all

select
  m.id as source_id,
  'ai_memory'::text as source_kind,
  coalesce(nullif(m.memory_key,''), 'AI MEMORY') as title,
  left(coalesce(nullif(m.content,''), m.memory,''), 700) as excerpt,
  'CALCULATED'::text as truth_state,
  coalesce(m.memory_key, m.id::text) as source_ref,
  m.updated_at as observed_at,
  false as verified,
  jsonb_build_object(
    'memory_type', m.memory_type,
    'agent_name', m.agent_name,
    'expires_at', m.expires_at
  ) as metadata
from public.ai_memory m
where m.user_id = (select auth.uid())

union all

select
  g.id as source_id,
  'graph_evidence'::text as source_kind,
  coalesce(nullif(g.source_type,''), 'GRAPH EVIDENCE') as title,
  left(coalesce(g.extracted_text,''), 700) as excerpt,
  case when g.human_verified then 'VERIFIED' else 'UNVERIFIED' end as truth_state,
  coalesce(g.source_url, g.source_row_id::text, g.id::text) as source_ref,
  coalesce(g.extraction_timestamp, now()) as observed_at,
  coalesce(g.human_verified,false) as verified,
  jsonb_build_object(
    'source_table', g.source_table,
    'extraction_confidence', g.extraction_confidence,
    'extraction_method', g.extraction_method,
    'ai_model_used', g.ai_model_used,
    'graph_entity_id', g.graph_entity_id,
    'graph_relationship_id', g.graph_relationship_id
  ) as metadata
from public.graph_evidence g
where g.user_id = (select auth.uid())

union all

select
  e.evidence_id as source_id,
  'platform_evidence'::text as source_kind,
  coalesce(nullif(e.evidence_type,''), 'PLATFORM EVIDENCE') as title,
  left(coalesce(cast(e.metadata as text),''), 700) as excerpt,
  case when e.status = 'verified' or e.verified_at is not null then 'VERIFIED' else 'LIVE' end as truth_state,
  coalesce(e.uri, e.subject_id, e.evidence_id::text) as source_ref,
  coalesce(e.verified_at, e.recorded_at, now()) as observed_at,
  (e.status = 'verified' or e.verified_at is not null) as verified,
  e.metadata as metadata
from public.omega_platform_evidence e
where e.owner_user_id = (select auth.uid());
grant select on public.omega_member_knowledge_loom to authenticated;

comment on view public.omega_member_knowledge_loom is
'Member-scoped provenance-first Knowledge Loom. SECURITY INVOKER; reads canonical knowledge, memory and evidence sources only. No synthetic records.';
