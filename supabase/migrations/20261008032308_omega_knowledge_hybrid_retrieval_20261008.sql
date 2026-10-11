-- Ω KNOWLEDGE LOOM HYBRID RETRIEVAL
create or replace function private.omega_knowledge_hybrid_search(p_query text,p_embedding text default null,p_limit integer default 20)
returns table(source_id uuid,chunk_id uuid,source_title text,publisher text,canonical_url text,source_type text,source_status text,quality_score numeric,evidence_level text,chunk_no integer,content text,provenance jsonb,lexical_rank real,semantic_rank real,hybrid_rank numeric,retrieval_mode text)
language plpgsql security definer set search_path='' as $$
declare v_query text:=trim(coalesce(p_query,'')); v_limit integer:=greatest(1,least(coalesce(p_limit,20),100)); v_embedding extensions.vector;
begin
if (select auth.uid()) is null then raise exception 'authentication required' using errcode='42501'; end if;
if v_query='' and nullif(trim(coalesce(p_embedding,'')),'') is null then return; end if;
if nullif(trim(coalesce(p_embedding,'')),'') is not null then v_embedding:=p_embedding::extensions.vector; end if;
return query with lexical as (
select c.id,ts_rank_cd(to_tsvector('simple',coalesce(c.content,'')),plainto_tsquery('simple',v_query))::real score from public.omega_knowledge_chunks c join public.omega_knowledge_sources s on s.id=c.source_id where s.status='approved' and v_query<>'' and plainto_tsquery('simple',v_query) @@ to_tsvector('simple',coalesce(c.content,'')) order by score desc,coalesce(s.quality_score,0) desc,c.chunk_no asc limit 200),
semantic as (select c.id,(1-(c.embedding <=> v_embedding))::real score from public.omega_knowledge_chunks c join public.omega_knowledge_sources s on s.id=c.source_id where s.status='approved' and v_embedding is not null and c.embedding is not null order by c.embedding <=> v_embedding asc,coalesce(s.quality_score,0) desc,c.chunk_no asc limit 200),
candidates as (select coalesce(l.id,se.id) id,coalesce(l.score,0)::real lexical_score,coalesce(se.score,0)::real semantic_score,(case when l.id is not null then 1.0/(60+row_number() over(order by l.score desc nulls last)) else 0 end)+(case when se.id is not null then 1.0/(60+row_number() over(order by se.score desc nulls last)) else 0 end) rrf from lexical l full outer join semantic se on se.id=l.id)
select s.id,c.id,s.title,s.publisher,s.canonical_url,s.source_type,s.status,s.quality_score,c.evidence_level,c.chunk_no,c.content,s.provenance,coalesce(ca.lexical_score,0),coalesce(ca.semantic_score,0),coalesce(ca.rrf,0)::numeric,case when v_embedding is not null and ca.lexical_score>0 then 'HYBRID' when v_embedding is not null then 'SEMANTIC' else 'LEXICAL' end from candidates ca join public.omega_knowledge_chunks c on c.id=ca.id join public.omega_knowledge_sources s on s.id=c.source_id where s.status='approved' order by ca.rrf desc,coalesce(s.quality_score,0) desc,c.chunk_no asc limit v_limit;
end; $$;
create or replace function public.omega_knowledge_hybrid_search(p_query text,p_embedding text default null,p_limit integer default 20)
returns table(source_id uuid,chunk_id uuid,source_title text,publisher text,canonical_url text,source_type text,source_status text,quality_score numeric,evidence_level text,chunk_no integer,content text,provenance jsonb,lexical_rank real,semantic_rank real,hybrid_rank numeric,retrieval_mode text)
language sql security invoker set search_path='' as $$ select * from private.omega_knowledge_hybrid_search($1,$2,$3); $$;
revoke execute on function private.omega_knowledge_hybrid_search(text,text,integer) from public,anon,authenticated;
revoke execute on function public.omega_knowledge_hybrid_search(text,text,integer) from public,anon;
grant execute on function public.omega_knowledge_hybrid_search(text,text,integer) to authenticated;
comment on function public.omega_knowledge_hybrid_search(text,text,integer) is 'Authenticated Knowledge Loom hybrid retrieval over approved sources. Optional vector input enables semantic retrieval; absent vectors fall back to lexical retrieval. No synthetic knowledge.';