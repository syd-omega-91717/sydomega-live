-- Reproduce the narrowly scoped production service-role read grants in clean database replays.
-- These grants already exist in the live project; this migration makes the privilege parity explicit.
begin;

grant select on table
  public.omega_agent_tasks,
  public.omega_agent_task_events
to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.omega_agent_tasks','SELECT')
     or not has_table_privilege('service_role','public.omega_agent_task_events','SELECT') then
    raise exception 'agent_task_service_role_read_grants_missing';
  end if;
  if has_table_privilege('anon','public.omega_agent_tasks','SELECT')
     or has_table_privilege('anon','public.omega_agent_task_events','SELECT') then
    raise exception 'agent_task_anon_read_privilege_unexpected';
  end if;
end;
$$;

commit;
