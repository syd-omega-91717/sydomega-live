-- Ω SYD OMEGA 91717
-- Keep Stripe webhook event storage server-only.
-- The Stripe webhook handler uses the service role, which bypasses RLS.

revoke all on table public.stripe_webhook_events from anon, authenticated;

drop policy if exists "stripe_webhook_events_deny_client_access" on public.stripe_webhook_events;

create policy "stripe_webhook_events_deny_client_access"
on public.stripe_webhook_events
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
