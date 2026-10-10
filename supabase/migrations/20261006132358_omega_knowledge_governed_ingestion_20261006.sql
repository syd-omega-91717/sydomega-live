
begin;

create table if not exists public.omega_knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.omega_knowledge_sources(id) on delete restrict,
  title text not null,
  content_sha256 text not null,
  content text not null,
  content_length integer not null,
  provenance jsonb not null default '{}'::jsonb,
  ingestion_status text not null default 'indexed' check (ingestion_status in ('received','indexed','rejected')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, content_sha256)
);

alter table public.omega_knowledge_chunks
  add column if not exists document_id uuid references public.omega_knowledge_documents(id) on delete cascade;

create index if not exists omega_knowledge_documents_source_idx
  on public.omega_knowledge_documents(source_id, created_at desc);

create index if not exists omega_knowledge_chunks_document_idx
  on public.omega_knowledge_chunks(document_id, chunk_no);

alter table public.omega_knowledge_documents enable row level security;

drop policy if exists omega_knowledge_documents_owner_select on public.omega_knowledge_documents;
create policy omega_knowledge_documents_owner_select
  on public.omega_knowledge_documents
  for select
  to authenticated
  using ((select auth.uid()) = created_by);

create or replace function private.omega_knowledge_ingest_document(
  p_source_id uuid,
  p_title text,
  p_content text,
  p_provenance jsonb default '{}'::jsonb,
  p_chunk_chars integer default 1800
)
returns table(document_id uuid, content_sha256 text, chunk_count integer, ingestion_status text)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_source public.omega_knowledge_sources%rowtype;
  v_content text := trim(coalesce(p_content,''));
  v_title text := trim(coalesce(p_title,''));
  v_hash text;
  v_doc_id uuid;
  v_chunks integer := 0;
  v_chunk_chars integer := greatest(400, least(coalesce(p_chunk_chars,1800), 8000));
  v_n integer;
  v_total integer;
  v_piece text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id=v_uid and p.is_owner=true
  ) then
    raise exception 'owner authorization required' using errcode='42501';
  end if;

  if p_source_id is null or v_title='' or v_content='' then
    raise exception 'source, title and content are required' using errcode='22023';
  end if;

  if length(v_content) > 2000000 then
    raise exception 'document exceeds 2000000 characters' using errcode='22023';
  end if;

  select * into v_source
  from public.omega_knowledge_sources
  where id=p_source_id;

  if not found or v_source.status <> 'approved' then
    raise exception 'knowledge source is not approved' using errcode='42501';
  end if;

  v_hash := encode(extensions.digest(convert_to(v_content,'utf8'),'sha256'),'hex');

  insert into public.omega_knowledge_documents(
    source_id,title,content_sha256,content,content_length,provenance,ingestion_status,created_by
  )
  values (
    p_source_id,v_title,v_hash,v_content,length(v_content),
    jsonb_build_object(
      'source_id',p_source_id,
      'source_title',v_source.title,
      'canonical_url',v_source.canonical_url,
      'publisher',v_source.publisher,
      'retrieved_at',v_source.retrieved_at,
      'ingested_at',now()
    ) || coalesce(p_provenance,'{}'::jsonb),
    'indexed',
    v_uid
  )
  on conflict (source_id,content_sha256)
  do update set
    title=excluded.title,
    content=excluded.content,
    content_length=excluded.content_length,
    provenance=excluded.provenance,
    ingestion_status='indexed',
    updated_at=now()
  returning id into v_doc_id;

  delete from public.omega_knowledge_chunks where document_id=v_doc_id;

  v_total := greatest(1, ceil(length(v_content)::numeric / v_chunk_chars)::integer);

  for v_n in 1..v_total loop
    v_piece := substring(v_content from ((v_n-1)*v_chunk_chars)+1 for v_chunk_chars);
    if length(trim(v_piece)) > 0 then
      insert into public.omega_knowledge_chunks(
        source_id,document_id,chunk_no,content,evidence_level,metadata
      )
      values (
        p_source_id,
        v_doc_id,
        v_n,
        v_piece,
        'PRIMARY_SOURCE',
        jsonb_build_object(
          'document_id',v_doc_id,
          'document_sha256',v_hash,
          'chunk_sha256',encode(extensions.digest(convert_to(v_piece,'utf8'),'sha256'),'hex'),
          'char_start',((v_n-1)*v_chunk_chars)+1,
          'char_end',least(v_n*v_chunk_chars,length(v_content))
        )
      );
      v_chunks := v_chunks + 1;
    end if;
  end loop;

  return query select v_doc_id,v_hash,v_chunks,'indexed'::text;
end;
$$;

create or replace function public.omega_knowledge_ingest_document(
  p_source_id uuid,
  p_title text,
  p_content text,
  p_provenance jsonb default '{}'::jsonb,
  p_chunk_chars integer default 1800
)
returns table(document_id uuid, content_sha256 text, chunk_count integer, ingestion_status text)
language sql
security invoker
set search_path=''
as $$
  select * from private.omega_knowledge_ingest_document($1,$2,$3,$4,$5);
$$;

revoke execute on function private.omega_knowledge_ingest_document(uuid,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function private.omega_knowledge_ingest_document(uuid,text,text,jsonb,integer) to service_role;

revoke execute on function public.omega_knowledge_ingest_document(uuid,text,text,jsonb,integer) from public,anon;
grant execute on function public.omega_knowledge_ingest_document(uuid,text,text,jsonb,integer) to authenticated;

commit;
