-- Omega SYD OMEGA 91717
-- Backfills real source control for tables that have been live in this
-- project since before this repo's SQL history but were never declared in
-- ANY file here -- confirmed via scripts/audit.py check 7 ("never CREATE
-- TABLE'd/VIEW'd anywhere in supabase/") and matches GAP_ANALYSIS.md's own
-- standing note: "~83 tables live that this repo's SQL never created."
--
-- That was a tolerable, safe gap while these tables were unused (RLS on,
-- no client). It stops being tolerable the moment real code depends on
-- them, which courses.html now does -- without this file, restoring this
-- database from the repo's own migration history would be missing the
-- table entirely. Every column/type/default/FK below is copied from a live
-- information_schema.columns + pg_constraint query, not guessed.
--
-- CREATE TABLE IF NOT EXISTS is a no-op against the live database (the
-- tables already exist); this file exists for the next fresh database and
-- for anyone reading the schema who is not this session.

create table if not exists public.academy_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  icon text,
  color text,
  created_at timestamptz default now(),
  constraint academy_categories_slug_key unique (slug)
);

create table if not exists public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.academy_categories(id),
  instructor_id uuid references public.profiles(id),
  title text not null,
  slug text not null,
  description text,
  thumbnail text,
  difficulty text default 'Beginner',
  language text default 'English',
  duration_minutes integer default 0,
  xp_reward integer default 100,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint academy_courses_slug_key unique (slug)
);

create table if not exists public.academy_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.academy_courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer default 1,
  created_at timestamptz default now()
);

create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.academy_modules(id) on delete cascade,
  title text not null,
  lesson_type text default 'video',
  video_url text,
  article text,
  attachment text,
  duration_minutes integer default 0,
  xp_reward integer default 20,
  sort_order integer default 1,
  created_at timestamptz default now()
);

create table if not exists public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.academy_courses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  progress numeric default 0,
  completed boolean default false,
  enrolled_at timestamptz default now(),
  constraint academy_enrollments_course_id_profile_id_key unique (course_id, profile_id)
);

-- academy_progress and academy_access already had real RLS and grants
-- (confirmed live) and are captured for the same reason as the tables
-- above -- they were also missing from every file in this repo.
create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.academy_enrollments(id) on delete cascade,
  lesson_id uuid references public.academy_lessons(id),
  completed boolean,
  completed_at timestamptz,
  user_id uuid references auth.users(id) on delete cascade,
  node_id text,
  xp_awarded integer,
  created_at timestamptz default now(),
  constraint academy_progress_user_node_unique unique (user_id, node_id)
);

create table if not exists public.academy_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz,
  stage integer,
  updated_at timestamptz default now()
);

alter table public.academy_categories enable row level security;
alter table public.academy_courses enable row level security;
alter table public.academy_modules enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_enrollments enable row level security;
alter table public.academy_progress enable row level security;
alter table public.academy_access enable row level security;
