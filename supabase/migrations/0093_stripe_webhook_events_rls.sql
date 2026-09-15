-- SYD OMEGA 91717
-- Security hardening: keep Stripe webhook event ingestion server-only.
-- The table intentionally has no client-facing policy. RLS remains enabled.

alter table if exists public.stripe_webhook_events enable row level security;

-- Explicitly document the intended security boundary without granting client access.
comment on table public.stripe_webhook_events is
  'Server-side Stripe webhook event ledger. RLS enabled with no client policies by design; service-role/server execution only.';
