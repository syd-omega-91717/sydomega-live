-- Omega SYD OMEGA 91717
-- Backfills real source control for the project-management scaffold
-- tables -- live since before this repo's SQL history, RLS-enabled with
-- no grant to any role, and never declared in any file here
-- (scripts/audit.py check 7). CREATE TABLE IF NOT EXISTS is a no-op
-- against the live database; this file exists for the next fresh
-- database and for anyone reading schema who is not this session.
-- Every column/type/default/FK below is copied from a live
-- information_schema.columns + pg_constraint query.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  icon text,
  color text,
  visibility text default 'private',
  status text default 'active',
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint projects_slug_key unique (slug)
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  constraint project_members_project_id_profile_id_key unique (project_id, profile_id)
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  uploader_id uuid references public.profiles(id),
  filename text,
  file_path text,
  mime_type text,
  file_size bigint,
  uploaded_at timestamptz default now()
);

create table if not exists public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  action text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  creator_id uuid references public.profiles(id),
  assignee_id uuid references public.profiles(id),
  title text not null,
  description text,
  priority text default 'normal',
  status text default 'todo',
  estimated_hours numeric,
  spent_hours numeric default 0,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  comment text,
  created_at timestamptz default now()
);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  filename text,
  file_path text,
  uploaded_at timestamptz default now()
);

create table if not exists public.task_labels (
  id uuid primary key default gen_random_uuid(),
  name text,
  color text,
  constraint task_labels_name_key unique (name)
);

create table if not exists public.task_label_map (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.task_labels(id) on delete cascade,
  constraint task_label_map_pkey primary key (task_id, label_id)
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_files enable row level security;
alter table public.project_activity enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_labels enable row level security;
alter table public.task_label_map enable row level security;
