-- SYD OMEGA 91717 — live Stripe webhook idempotency baseline.
-- This file materializes the migration version already applied on production.
-- It deliberately preserves the existing public Edge Function -> RPC boundary.

BEGIN;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon, authenticated;

COMMIT;
