-- Race-safe idempotency for authenticated event ingestion.
-- Live duplicate audit on 2026-09-29 returned zero conflicting rows.
CREATE UNIQUE INDEX IF NOT EXISTS omega_platform_events_actor_type_idempotency_uidx
ON public.omega_platform_events (
  actor_user_id,
  event_type,
  (metadata->>'idempotency_key')
)
WHERE metadata ? 'idempotency_key';
