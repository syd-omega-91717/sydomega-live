# Ω SYD OMEGA 91717 — Mission / Quest State

## Purpose
Provide the first server-authoritative state layer after Event Fabric and Evidence Graph.

## Model
- Mission definition: versioned actionable objective.
- Quest definition: versioned multi-mission container.
- Quest membership: ordered mission sequence.
- Member mission state: one authoritative state per member + mission.
- Member quest state: one authoritative state per member + quest.
- Transition log: immutable evidence of state transitions.

## Lifecycle
MISSION DEFINED → MEMBER ACTIVE → EVIDENCE LINKED → SERVER VALIDATES → COMPLETED → EVENT EMITTED.

## Authority
The browser cannot insert, update, delete, or complete mission state directly. Authenticated members can read only their own state. State mutation is exposed only through authenticated, private-schema PostgreSQL functions.

## Completion truth boundary
A completion requires persisted member-owned evidence:
- authenticated platform events owned by the member, and/or
- graph evidence owned by the member.

If a mission definition declares `completion_rule.required_event_types`, every required event type must be present in the submitted persisted evidence. The state transition is performed server-side.

This layer does not grant achievements, credentials, ownership, financial value, or authorization.

## Reality labels
Mission state is `LIVE` when read from persisted production state. A visual preview or hypothetical mission remains `SIMULATED`.

## Empty-state rule
No missions or quests are seeded until product owners define their real mission definitions and completion rules. Empty tables are intentional and prevent fabricated progression.

## Evidence
Migration:
- `20260928135609_omega_mission_state_foundation_20260928.sql`
- `20260928135726_omega_mission_state_start_idempotency_fix_20260928.sql`

Live verification performed against Supabase project `ydqhzvvoyufiiqvzcjns`: tables exist with RLS enabled; anonymous table reads are not granted; authenticated direct updates are not granted; mission mutation functions are executable only by authenticated callers; definition/state tables are empty by design.
