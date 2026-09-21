-- Omega SYD OMEGA 91717
-- Backfills real source control for academy_exams/academy_questions/
-- academy_exam_results -- live since before this repo's SQL history,
-- RLS-enabled with no grant to any role (CLAUDE.md 8.1 class 6c: correct
-- RLS + no GRANT = every query 42501, confirmed live via pg_class +
-- information_schema.role_table_grants before writing this), and never
-- declared in any file here (scripts/audit.py check 7). The prior academy
-- courses migration deliberately left these three deny-by-default -- this
-- migration is that flagged follow-up, not a new decision.
--
-- CREATE TABLE IF NOT EXISTS is a no-op against the live database; this
-- file exists for the next fresh database and for anyone reading schema
-- who is not this session. Every column/type/default/FK below is copied
-- from a live information_schema.columns + pg_constraint query.

create table if not exists public.academy_exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.academy_courses(id),
  title text,
  pass_score integer default 70,
  duration_minutes integer default 30,
  created_at timestamptz default now()
);

create table if not exists public.academy_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.academy_exams(id) on delete cascade,
  question text not null,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text,
  points integer default 1
);

create table if not exists public.academy_exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.academy_exams(id),
  profile_id uuid references public.profiles(id),
  score numeric,
  passed boolean,
  completed_at timestamptz default now()
);

alter table public.academy_exams enable row level security;
alter table public.academy_questions enable row level security;
alter table public.academy_exam_results enable row level security;
