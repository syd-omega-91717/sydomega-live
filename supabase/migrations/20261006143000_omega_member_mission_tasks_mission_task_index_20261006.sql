begin;
create index if not exists omega_member_mission_tasks_mission_task_id_idx
  on public.omega_member_mission_tasks(mission_task_id);
commit;