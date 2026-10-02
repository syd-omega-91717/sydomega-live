begin;

-- Service/automation-only SECURITY DEFINER functions must never be callable
-- through the authenticated Data API role.
revoke execute on function public.apply_subscription(uuid,text,text,timestamptz,text) from public,anon,authenticated;
revoke execute on function public.award_points(uuid,integer,text,text) from public,anon,authenticated;
revoke execute on function public.award_token(uuid,text,numeric) from public,anon,authenticated;
revoke execute on function public.grant_permanent_access(uuid) from public,anon,authenticated;
revoke execute on function public.grant_trial_access(uuid) from public,anon,authenticated;
revoke execute on function public.approve_member(uuid) from public,anon,authenticated;
revoke execute on function public.reject_member(uuid) from public,anon,authenticated;
revoke execute on function public.revoke_member(uuid) from public,anon,authenticated;
revoke execute on function public.set_platform_flag(text,boolean) from public,anon,authenticated;
revoke execute on function public.sweep_expired_trials() from public,anon,authenticated;
revoke execute on function public.sync_platform_owner() from public,anon,authenticated;
revoke execute on function public.trg_award_exam_points() from public,anon,authenticated;
revoke execute on function public.trg_award_matrix_points() from public,anon,authenticated;
revoke execute on function public.trg_award_task_points() from public,anon,authenticated;

grant execute on function public.apply_subscription(uuid,text,text,timestamptz,text) to service_role;
grant execute on function public.award_points(uuid,integer,text,text) to service_role;
grant execute on function public.award_token(uuid,text,numeric) to service_role;
grant execute on function public.grant_permanent_access(uuid) to service_role;
grant execute on function public.grant_trial_access(uuid) to service_role;
grant execute on function public.approve_member(uuid) to service_role;
grant execute on function public.reject_member(uuid) to service_role;
grant execute on function public.revoke_member(uuid) to service_role;
grant execute on function public.set_platform_flag(text,boolean) to service_role;
grant execute on function public.sweep_expired_trials() to service_role;
grant execute on function public.sync_platform_owner() to service_role;
grant execute on function public.trg_award_exam_points() to service_role;
grant execute on function public.trg_award_matrix_points() to service_role;
grant execute on function public.trg_award_task_points() to service_role;

-- Webhook receipts are server-owned. Keep an explicit policy for the
-- privileged service role even though service_role bypasses RLS.
drop policy if exists omega_stripe_webhook_service on public.stripe_webhook_events;
create policy omega_stripe_webhook_service
  on public.stripe_webhook_events
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- Remove the duplicate provider/event index; retain the named unique
-- constraint index as the canonical uniqueness boundary.
drop index if exists public.omega_payment_events_provider_event_uidx;

commit;