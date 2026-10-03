# Ω SYD OMEGA 91717 — Durable Event Fabric

## Purpose
Turn the existing omega_platform_events table into a governed continuity source without introducing a second event store.

## Contract
Every accepted browser/member event has an authenticated actor derived from JWT, an allowlisted event type, bounded route data, JSON metadata, schema_version 1, optional idempotency, server-side insertion, and a persisted event ID/timestamp.

## Allowed event types
route_view
action_started
action_completed
mission_progress
capability_used
simulation_run
evidence_recorded
replay_checkpoint

These describe observable platform events. They do not themselves prove business completion, achievement, payment, ownership, authorization, or financial value.

## Idempotency
When supplied, metadata.idempotency_key is unique for actor + event type. The database constraint is authoritative; application lookup is only an optimization.

## Security
The ingestion function validates the caller through Supabase Auth, derives identity from the verified JWT, uses the service role only for the controlled insert, and never accepts a caller-supplied member identity.

## Truth boundary
An event proves that the platform recorded an event. It does not automatically prove that the underlying business action was valid or completed correctly.

## Evolution
EVENT → EVIDENCE → CAPABILITY → MISSION STATE → REALTIME WORLD → TEMPORAL REPLAY
