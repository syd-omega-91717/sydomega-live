-- SYD OMEGA 91717 — live Stripe idempotent apply migration snapshot.
-- Production already carries the event status/timestamp columns. Keep the
-- migration reproducible without replacing the existing apply_subscription()
-- RPC contract.

BEGIN;

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'processing';

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon, authenticated;

COMMIT;
