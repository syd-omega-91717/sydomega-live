CREATE INDEX IF NOT EXISTS idx_projects_owner
ON public.projects(owner_id);

CREATE INDEX IF NOT EXISTS idx_projects_org
ON public.projects(organization_id);

CREATE INDEX IF NOT EXISTS idx_project_members_profile
ON public.project_members(profile_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project
ON public.tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee
ON public.tasks(assignee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_task_comments_task
ON public.task_comments(task_id);

CREATE INDEX IF NOT EXISTS idx_project_activity_project
ON public.project_activity(project_id);
