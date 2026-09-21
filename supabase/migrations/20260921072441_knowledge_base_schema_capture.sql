-- Omega SYD OMEGA 91717
-- Backfills real source control for knowledge_documents/knowledge_spaces/
-- knowledge_attachments -- live since before this repo's SQL history,
-- never declared as a CREATE TABLE anywhere in this repo (knowledge_nodes/
-- knowledge_edges ARE already declared, in 0056_entreprise_schema_v2.sql --
-- only these three were the gap). RLS-enabled with no grant to any role.
-- CREATE TABLE IF NOT EXISTS is a no-op against the live database; every
-- column/type/default/FK below is copied from a live
-- information_schema.columns + pg_constraint query.

create table if not exists public.knowledge_spaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  visibility text default 'private',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint knowledge_spaces_slug_key unique (slug)
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.knowledge_spaces(id) on delete cascade,
  author_id uuid references public.profiles(id),
  title text not null,
  slug text,
  summary text,
  body text,
  version integer default 1,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.knowledge_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.knowledge_documents(id) on delete cascade,
  uploader_id uuid references public.profiles(id),
  filename text,
  file_path text,
  mime_type text,
  file_size bigint,
  uploaded_at timestamptz default now()
);

alter table public.knowledge_spaces enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_attachments enable row level security;
