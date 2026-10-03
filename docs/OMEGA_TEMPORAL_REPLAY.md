# Ω Temporal Replay

## Role
Temporal Replay turns persisted omega_platform_events into a chronological, read-only historical view.

## Contract
PERSISTED EVENT → CHRONOLOGY → OBSERVATION

It does not create, infer, execute, reverse, or mutate events; it does not expose internal queues; and it does not turn metadata into authorization, ownership, payment, achievement, or credential truth.

## Source
The live omega_platform_events schema provides id, event_type, route, actor_user_id, metadata, and created_at. The authenticated query is constrained to the current member's actor_user_id.

## Future extension
Event schema/version identifiers, provenance links, evidence links, snapshots, and deterministic replay checkpoints may be added only when authoritative production fields exist.
