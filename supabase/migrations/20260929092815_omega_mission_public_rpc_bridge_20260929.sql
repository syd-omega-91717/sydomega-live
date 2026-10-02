-- Public PostgREST bridge for the server-authoritative mission functions.
-- The business logic remains in private schema; these wrappers only expose the
-- authenticated RPC surface needed by the browser mission board.

create or replace function public.omega_start_mission(
  p_mission_id uuid,
  p_idempotency_key text default null
)
returns public.omega_member_mission_state
language sql
security invoker
set search_path = ''
as $$
  select private.omega_start_mission($1, $2);
$$;

create or replace function public.omega_complete_mission(
  p_member_mission_id uuid,
  p_evidence_event_ids bigint[] default '{}',
  p_graph_evidence_ids uuid[] default '{}',
  p_idempotency_key text default null
)
returns public.omega_member_mission_state
language sql
security invoker
set search_path = ''
as $$
  select private.omega_complete_mission($1, $2, $3, $4);
$$;

revoke execute on function public.omega_start_mission(uuid, text) from public, anon;
revoke execute on function public.omega_complete_mission(uuid, bigint[], uuid[], text) from public, anon;
grant execute on function public.omega_start_mission(uuid, text) to authenticated;
grant execute on function public.omega_complete_mission(uuid, bigint[], uuid[], text) to authenticated;
