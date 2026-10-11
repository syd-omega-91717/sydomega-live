-- REPLAY PRELUDE (added 2026-10-06, not part of what ran live).
-- The statements below that this file ran live read schema that exists live
-- but that no migration creates, so a database built from migrations alone
-- failed here (42703/42P01 in the full replay). Every statement is IF NOT
-- EXISTS -- a no-op live, where each object exists exactly as declared
-- (pg_attribute / pg_constraint, 2026-10-06) -- except where noted: a live
-- NOT NULL with no default is left off so earlier inserts still replay; a
-- table gets RLS but not its live policy, i.e. it replays locked (the safe
-- direction).
-- document_id (and its FK) is added by 20261006132358, as it was live.
create table if not exists public.omega_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.omega_knowledge_sources(id) on delete cascade,
  chunk_no integer not null,
  content text not null,
  evidence_level text not null default 'emerging',
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_no)
);
alter table public.omega_knowledge_chunks enable row level security;

begin;

create index if not exists omega_knowledge_chunks_fts_idx
on public.omega_knowledge_chunks
using gin (to_tsvector('simple',content));

create index if not exists omega_knowledge_sources_status_idx
on public.omega_knowledge_sources(status,quality_score desc);

create or replace function private.omega_knowledge_search(
  p_query text,
  p_limit integer default 20
)
returns table(
  source_id uuid,
  chunk_id uuid,
  source_title text,
  publisher text,
  canonical_url text,
  source_type text,
  source_status text,
  quality_score numeric,
  evidence_level text,
  chunk_no integer,
  content text,
  provenance jsonb,
  rank real
)
language plpgsql
security definer
set search_path=''
as $$
declare v_query text:=trim(coalesce(p_query,''));
begin
 if (select auth.uid()) is null then raise exception 'authentication required' using errcode='42501'; end if;
 if v_query='' then return; end if;
 return query
 select s.id,c.id,s.title,s.publisher,s.canonical_url,s.source_type,s.status,s.quality_score,
        c.evidence_level,c.chunk_no,c.content,s.provenance,
        ts_rank_cd(to_tsvector('simple',coalesce(c.content,'')),plainto_tsquery('simple',v_query))::real
 from public.omega_knowledge_chunks c
 join public.omega_knowledge_sources s on s.id=c.source_id
 where s.status='approved'
   and plainto_tsquery('simple',v_query) @@ to_tsvector('simple',coalesce(c.content,''))
 order by ts_rank_cd(to_tsvector('simple',coalesce(c.content,'')),plainto_tsquery('simple',v_query)) desc,
          coalesce(s.quality_score,0) desc,c.chunk_no asc
 limit greatest(1,least(coalesce(p_limit,20),100));
end;
$$;

create or replace function public.omega_knowledge_search(
 p_query text,
 p_limit integer default 20
)
returns table(
 source_id uuid,chunk_id uuid,source_title text,publisher text,canonical_url text,
 source_type text,source_status text,quality_score numeric,evidence_level text,
 chunk_no integer,content text,provenance jsonb,rank real
)
language sql
security invoker
set search_path=''
as $$ select * from private.omega_knowledge_search($1,$2); $$;

revoke execute on function private.omega_knowledge_search(text,integer) from public,anon,authenticated;
revoke execute on function public.omega_knowledge_search(text,integer) from public,anon;
grant execute on function public.omega_knowledge_search(text,integer) to authenticated;

comment on function public.omega_knowledge_search(text,integer) is
'Authenticated lexical Knowledge Loom retrieval with source provenance and evidence metadata. Returns no results when no indexed chunks exist; never fabricates knowledge.';

commit;
