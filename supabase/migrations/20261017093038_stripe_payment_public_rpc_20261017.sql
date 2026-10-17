-- Ω SYD OMEGA 91717 — stripe-webhook can record a payment
-- stripe-webhook called admin.schema("omega_private").rpc("record_stripe_payment").
-- PostgREST exposes only public, graphql_public: that request returns
-- 406 PGRST106 (probed live 2026-10-17), and service_role has no USAGE on
-- omega_private either. Every paid checkout.session.completed and
-- invoice.payment_succeeded would have failed to settle (500 settlement_error).
-- 0 Stripe events had ever been received, so nothing was lost.
--
-- Same fix as the notification worker (20261017092002): a public SECURITY
-- DEFINER delegate with the canonical signature and default, so
-- omega_private.record_stripe_payment (20261002072345) keeps every check —
-- event id, amount, currency, user existence, idempotency, ledger posting.
-- EXECUTE is service_role only; the explicit anon/authenticated revoke matters
-- because public's default ACL grants EXECUTE on new functions to both. A
-- client that could call this would post ledger transactions.

begin;

create or replace function public.record_stripe_payment(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_provider_reference text,
  p_payload_hash text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language sql
security definer
set search_path = ''
as $$
  select omega_private.record_stripe_payment(
    p_event_id, p_event_type, p_user_id, p_amount_minor, p_currency,
    p_provider_reference, p_payload_hash, p_metadata
  );
$$;

revoke all on function public.record_stripe_payment(text, text, uuid, bigint, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_stripe_payment(text, text, uuid, bigint, text, text, text, jsonb) to service_role;

commit;
