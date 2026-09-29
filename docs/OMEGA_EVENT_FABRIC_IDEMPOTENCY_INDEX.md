# Event Fabric Idempotency Index

The authoritative uniqueness structure for authenticated event ingestion is `omega_platform_events_member_idempotency_idx`, created by `20260928100000_omega_event_fabric_idempotency.sql`.

The later `omega_platform_events_actor_type_idempotency_uidx` index duplicated that constraint for authenticated ingestion. The cleanup migration removes only that redundant index; no event rows or authorization rules are changed.
