-- Remove the redundant 2026-09-29 event idempotency index.
-- The original 2026-09-28 actor-scoped index remains authoritative.
DROP INDEX IF EXISTS public.omega_platform_events_actor_type_idempotency_uidx;
