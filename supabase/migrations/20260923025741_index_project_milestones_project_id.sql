-- Ω SYD OMEGA 91717
-- Cover the project_milestones.project_id foreign key for parent-project lookups
-- and referential actions without changing application behavior.
create index if not exists project_milestones_project_id_idx
  on public.project_milestones (project_id);
