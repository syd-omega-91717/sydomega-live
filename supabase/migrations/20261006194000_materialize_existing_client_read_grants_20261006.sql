-- Materialize existing least-privilege client grants for Creation/Agent/Trust support tables.
-- These grants already exist on production; this migration makes them reproducible.

grant select on table
  public.omega_notifications,
  public.omega_user_achievements,
  public.omega_certificates,
  public.omega_achievement_definitions,
  public.omega_agent_tasks,
  public.omega_agent_task_events,
  public.omega_matrix_node_semantics
to authenticated;
