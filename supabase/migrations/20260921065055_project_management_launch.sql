-- Omega SYD OMEGA 91717
-- Activates a v1 slice of the dormant project-management scaffold:
-- projects + tasks + a new project_milestones table. project_members/
-- project_files/project_activity/task_comments/task_attachments/
-- task_labels/task_label_map stay deny-by-default -- collaboration
-- features are a real, separate follow-up, matching the academy_exams
-- pattern from the courses launch.
--
-- This is a MIGRATION of a real, already-working page (projects.html),
-- not a fresh build: the page currently runs entirely on localStorage
-- (omega_projects/omega_proj_tasks) with a real category+priority+
-- milestones UX that has no equivalent column in the live scaffold.
-- category/priority are added to projects as real columns (the live
-- schema only had status/visibility); milestones get their own child
-- table rather than a JSONB blob, matching the relational shape every
-- other table in this scaffold already uses (project_activity,
-- project_files are both per-project child tables).
--
-- Individual-owner model per the owner's own retirement-project framing
-- (courses migration) -- a project belongs to one owner_id, no
-- organization/team layer needed for v1. organization_id stays unused
-- (nullable already).

alter table public.projects add column if not exists category text;
alter table public.projects add column if not exists priority text default 'medium';

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  text text not null,
  due_date date,
  done boolean default false,
  sort_order integer default 1,
  created_at timestamptz default now()
);
alter table public.project_milestones enable row level security;

-- ── projects: single-owner in v1, no team layer yet ────────────────────
drop policy if exists omega_deny_by_default on public.projects;

create policy projects_owner_all on public.projects
  for all
  using ((select auth.uid()) = owner_id or private.is_platform_owner())
  with check ((select auth.uid()) = owner_id or private.is_platform_owner());

grant select, insert, update, delete on public.projects to authenticated;

-- ── tasks: visible/writable via the parent project's ownership ─────────
drop policy if exists omega_deny_by_default on public.tasks;

create policy tasks_via_project_owner on public.tasks
  for all
  using (
    private.is_platform_owner()
    or exists (select 1 from public.projects p where p.id = tasks.project_id and p.owner_id = (select auth.uid()))
  )
  with check (
    private.is_platform_owner()
    or exists (select 1 from public.projects p where p.id = tasks.project_id and p.owner_id = (select auth.uid()))
  );

grant select, insert, update, delete on public.tasks to authenticated;

-- ── project_milestones: same shape as tasks ─────────────────────────────
create policy project_milestones_via_project_owner on public.project_milestones
  for all
  using (
    private.is_platform_owner()
    or exists (select 1 from public.projects p where p.id = project_milestones.project_id and p.owner_id = (select auth.uid()))
  )
  with check (
    private.is_platform_owner()
    or exists (select 1 from public.projects p where p.id = project_milestones.project_id and p.owner_id = (select auth.uid()))
  );

grant select, insert, update, delete on public.project_milestones to authenticated;
