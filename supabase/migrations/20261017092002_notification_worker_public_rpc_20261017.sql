-- Ω SYD OMEGA 91717 — notification worker RPCs reachable from PostgREST
-- omega-notification-worker calls ctx.supabaseAdmin.rpc('claim_notifications'),
-- 'mark_notification_delivered' and 'mark_notification_failed' with no schema,
-- so PostgREST looks in public. The functions live only in omega_private
-- (20261002080219, 20261002029000), and that schema is unreachable twice over,
-- measured live 2026-10-17:
--   - PostgREST exposes only public, graphql_public: a request with
--     Content-Profile: omega_private returns 406 PGRST106;
--   - service_role has no USAGE on omega_private, so its EXECUTE grants there
--     could not be used even if the schema were exposed.
-- Every worker call therefore returned PGRST202 and nothing was ever delivered.
--
-- These wrappers are the public entry points, nothing more: same signatures,
-- same defaults, delegating to the omega_private functions, which keep every
-- check. SECURITY DEFINER is required (an invoker wrapper still needs USAGE on
-- omega_private); search_path is ''. EXECUTE is service_role only; the
-- explicit anon/authenticated revoke matters because public's default ACL
-- grants EXECUTE on new functions to both.

begin;

create or replace function public.claim_notifications(
  p_limit integer default 25,
  p_worker_id text default 'omega-notification-worker',
  p_channels text[] default array['in_app']::text[],
  p_reclaim_after interval default interval '15 minutes'
) returns setof uuid
language sql
security definer
set search_path = ''
as $$
  select * from omega_private.claim_notifications(p_limit, p_worker_id, p_channels, p_reclaim_after);
$$;

create or replace function public.mark_notification_delivered(
  p_notification_id uuid,
  p_channel text
) returns boolean
language sql
security definer
set search_path = ''
as $$
  select omega_private.mark_notification_delivered(p_notification_id, p_channel);
$$;

create or replace function public.mark_notification_failed(
  p_notification_id uuid,
  p_reason text
) returns boolean
language sql
security definer
set search_path = ''
as $$
  select omega_private.mark_notification_failed(p_notification_id, p_reason);
$$;

revoke all on function public.claim_notifications(integer, text, text[], interval) from public, anon, authenticated;
revoke all on function public.mark_notification_delivered(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_notification_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_notifications(integer, text, text[], interval) to service_role;
grant execute on function public.mark_notification_delivered(uuid, text) to service_role;
grant execute on function public.mark_notification_failed(uuid, text) to service_role;

commit;
