# Ω Creation Layer — Truth Enforcement

## Purpose

The Creation Layer now treats provider-owned state as server-governed state rather than client-editable metadata.

## Enforced boundary

Authenticated clients cannot directly INSERT, UPDATE, or DELETE rows in:

- `omega_creative_projects`
- `omega_creative_assets`
- `omega_experience_definitions`
- `omega_experience_runs`

Creation and mutation go through authenticated public RPC wrappers. Privileged implementations live in the non-exposed `private` schema with `SECURITY DEFINER`, empty `search_path`, explicit ownership checks, and restricted execution.

This follows Supabase's current guidance that privileged functions should be tightly scoped, use an empty search path, and receive explicit execute grants. citeturn1search0turn1search1

## Truth rules

### Projects

Client-created projects are forced to:

- `status = DRAFT`
- `truth_state = USER-CREATED`

Provider status cannot be supplied by the client.

### Assets

Client-created assets are forced to:

- `status = DESIGNED`
- `truth_state = USER-CREATED`
- provenance records `origin=USER-CREATED` and `verified=false`

Provider identity, provider asset ID, storage path, content hash, READY state, and LIVE truth remain server/provider-owned.

### Experiences

Client-created experiences are forced to:

- `status = DRAFT`
- `truth_state = SIMULATED`

Publication is a governed RPC transition to `PUBLISHED`; it does not convert simulated content into real-world fact.

### Runs

Clients cannot directly write run rows. Start, step, and abandon are governed RPC operations.

Run steps automatically emit canonical `omega_platform_events` records. Scores remain server-owned and are not client-set.

## Cross-member play

Published experience definitions are readable by authenticated members. Draft and retired definitions remain owner-scoped.

## Verification

Live verification on 2026-10-06 confirmed:

- authenticated table INSERT/UPDATE privileges are removed from all four creation tables;
- authenticated execution is granted only to the public governed wrappers;
- anonymous execution is denied;
- a rollback transaction successfully exercised project creation and produced `DRAFT` state without leaving a record;
- the Security Advisor remains at the single pre-existing warning: leaked-password protection is disabled.

## Remaining reality gap

Provider-specific adapters still need to be connected. Until an actual provider job writes provider identity, artifact location, content hash, licensing/provenance evidence, and a verified terminal state, a creative asset remains `USER-CREATED` / `DESIGNED`.

No provider integration is represented as LIVE merely because the database pipeline exists.
