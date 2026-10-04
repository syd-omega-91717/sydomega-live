-- Ω SYD OMEGA 91717 — Governed privacy export provenance
-- Live migration version: 20261004084002.

create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := (select auth.uid());
  _pr record;
  _tasks jsonb;
  _events jsonb;
  _consents jsonb;
  _request_id uuid;
begin
  if _uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  select axis_a, axis_b, axis_c, display_name, subscription_tier, created_at
  into _pr
  from public.profiles
  where id = _uid;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  insert into public.data_export_requests(user_id, status)
  values (_uid, 'processing')
  returning id into _request_id;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'task', task_name, 'axis', axis_type, 'points', points_earned, 'at', completed_at
    ) order by completed_at),
    '[]'::jsonb
  )
  into _tasks
  from public.task_completions
  where user_id = _uid;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'event', event_type, 'data', event_data, 'at', occurred_at
    ) order by occurred_at),
    '[]'::jsonb
  )
  into _events
  from public.sovereign_events
  where user_id = _uid;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'type', consent_type,
      'granted', granted,
      'version', version,
      'granted_at', granted_at,
      'revoked_at', revoked_at
    ) order by granted_at),
    '[]'::jsonb
  )
  into _consents
  from public.consent_records
  where user_id = _uid;

  update public.data_export_requests
  set status = 'ready', completed_at = now()
  where id = _request_id;

  return jsonb_build_object(
    'ok', true,
    'export_request_id', _request_id,
    'export_date', now(),
    'profile', jsonb_build_object(
      'name', _pr.display_name,
      'tier', _pr.subscription_tier,
      'joined', _pr.created_at,
      'axis_a', _pr.axis_a,
      'axis_b', _pr.axis_b,
      'axis_c', _pr.axis_c
    ),
    'task_completions', _tasks,
    'sovereign_events', _events,
    'consent_records', _consents,
    'consent_types', array['analytics','marketing','recommendations','personalisation','terms'],
    'legal_basis', 'Legitimate Interest (platform progression) + Consent (analytics/marketing)',
    'retention_policy', 'Profile data: retained until erasure request. Event log: 5 years for audit.'
  );
exception
  when others then
    if _request_id is not null then
      update public.data_export_requests set status = 'failed' where id = _request_id;
    end if;
    raise;
end;
$$;

revoke all on function public.export_my_data() from public;
grant execute on function public.export_my_data() to authenticated;
