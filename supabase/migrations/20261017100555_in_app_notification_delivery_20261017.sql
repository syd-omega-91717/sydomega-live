-- Ω SYD OMEGA 91717 — in-app notifications get delivered, and members can read them
-- omega_private.enqueue_notification queues rows in public.omega_notifications
-- (service-order activation, certificate issuance), but nothing ever moved them
-- on: omega-notification-worker could not reach its RPCs until 20261017092002,
-- no cron.job existed (0 rows, 2026-10-17), and a scheduled HTTP call to the
-- worker cannot authenticate — it accepts only the server secret key, and no
-- key is stored in Vault. notifications.html also read only localStorage, so a
-- delivered row was invisible either way.
--
-- 1. omega_private.deliver_in_app_notifications runs the worker's exact
--    in_app loop in the database: claim (SKIP LOCKED, 15-minute reclaim),
--    mark delivered, mark failed on error. Definer, search_path ''. EXECUTE is
--    service_role only; pg_cron runs it as the job owner.
-- 2. pg_cron job omega-in-app-notification-delivery runs it every minute.
--    cron.schedule upserts by name, so re-applying does not duplicate it.
-- 3. authenticated may UPDATE read_at only. Policy
--    omega_notifications_owner_update (own rows, USING and WITH CHECK) has
--    existed with no UPDATE grant, so it never ran (§8.1 class 6c); a column
--    grant keeps every other field — status, title, body — server-owned.

begin;

create or replace function omega_private.deliver_in_app_notifications(
  p_limit integer default 100
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_delivered integer := 0;
begin
  for v_id in
    select * from omega_private.claim_notifications(
      p_limit,
      'pg_cron:omega-in-app-notification-delivery',
      array['in_app']::text[],
      interval '15 minutes'
    )
  loop
    begin
      if omega_private.mark_notification_delivered(v_id, 'in_app') then
        v_delivered := v_delivered + 1;
      end if;
    exception when others then
      perform omega_private.mark_notification_failed(v_id, sqlerrm);
    end;
  end loop;
  return v_delivered;
end;
$$;

revoke all on function omega_private.deliver_in_app_notifications(integer) from public, anon, authenticated;
grant execute on function omega_private.deliver_in_app_notifications(integer) to service_role;

grant update (read_at) on table public.omega_notifications to authenticated;

do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'omega-in-app-notification-delivery',
      '* * * * *',
      'select omega_private.deliver_in_app_notifications(100)'
    );
  end if;
end
$$;

commit;
