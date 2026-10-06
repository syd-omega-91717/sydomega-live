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
