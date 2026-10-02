-- Ω SYD OMEGA 91717
-- Authoritative progression event bridge
-- Repository migration record. Live application to target project nvgedlxlkdzvcelimbvq is NOT verified here.
-- Historical comment referenced a different project; see config/supabase-migration-provenance.json.

create or replace function private.record_task_sovereign_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.sovereign_events (
    event_id, user_id, event_type, event_data, axis_delta,
    auth_before, auth_after, occurred_at, idempotency_key
  )
  values (
    gen_random_uuid(),
    new.user_id,
    'sovereign.task.completed',
    jsonb_build_object(
      'taskCompletionId', new.id,
      'taskName', new.task_name,
      'taskType', new.task_type,
      'axisType', new.axis_type,
      'description', new.description,
      'points', new.points_earned,
      'axisBefore', jsonb_build_object('a', new.axis_a_before, 'b', new.axis_b_before, 'c', new.axis_c_before),
      'axisAfter', jsonb_build_object('a', new.axis_a_after, 'b', new.axis_b_after, 'c', new.axis_c_after)
    ),
    jsonb_build_object('axis', new.axis_type, 'delta', new.points_earned),
    case new.axis_type when 'a' then new.axis_a_before when 'b' then new.axis_b_before else new.axis_c_before end,
    new.auth_after,
    coalesce(new.completed_at, now()),
    'task_completion:' || new.id::text
  )
  on conflict (idempotency_key) do nothing;
  return new;
end;
$$;

revoke execute on function private.record_task_sovereign_event() from public, anon, authenticated;
drop trigger if exists task_completion_sovereign_event on public.task_completions;
create trigger task_completion_sovereign_event
after insert on public.task_completions
for each row execute function private.record_task_sovereign_event();
do $
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='sovereign_events'
  ) then
    alter publication supabase_realtime add table public.sovereign_events;
  end if;
end
$;
