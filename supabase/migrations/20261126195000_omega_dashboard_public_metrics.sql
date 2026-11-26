-- Ω SYD OMEGA 91717
-- Privacy-safe aggregate metrics for member-facing dashboard surfaces.
-- Direct table counts are intentionally incomplete under RLS:
-- profiles are private by default, task_completions are self-scoped, and
-- platform_events are owner-readable. Do not weaken those row policies to
-- make dashboard counters appear global. This RPC returns counts only.

begin;

create or replace function private.omega_dashboard_public_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'schema_version', 1,
    'as_of', pg_catalog.now(),
    'approved_members', (
      select pg_catalog.count(*)::bigint
        from public.profiles p
       where coalesce(p.access_approved, false) = true
    ),
    'online_members', (
      select pg_catalog.count(distinct mp.user_id)::bigint
        from public.member_presence mp
       where mp.is_online is true
         and mp.last_seen >= pg_catalog.now() - interval '90 seconds'
    ),
    'tasks_today', (
      select pg_catalog.count(*)::bigint
        from public.task_completions tc
       where tc.completed_at >= pg_catalog.date_trunc('day', pg_catalog.now())
    ),
    'tasks_7d', (
      select pg_catalog.count(*)::bigint
        from public.task_completions tc
       where tc.completed_at >= pg_catalog.now() - interval '7 days'
    ),
    'events_today', (
      select pg_catalog.count(*)::bigint
        from public.platform_events pe
       where pe.created_at >= pg_catalog.date_trunc('day', pg_catalog.now())
    )
  );
end;
$function$;

revoke all on function private.omega_dashboard_public_metrics() from public, anon, authenticated;
grant execute on function private.omega_dashboard_public_metrics() to authenticated;

create or replace function public.omega_dashboard_public_metrics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.omega_dashboard_public_metrics();
$function$;

revoke all on function public.omega_dashboard_public_metrics() from public, anon;
grant execute on function public.omega_dashboard_public_metrics() to authenticated;

comment on function public.omega_dashboard_public_metrics() is
  'Authenticated aggregate-only dashboard counters. Returns no profile, task, event, or presence rows; private row-level policies remain unchanged.';

commit;
