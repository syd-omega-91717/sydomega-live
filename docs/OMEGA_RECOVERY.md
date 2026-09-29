# Ω SYD OMEGA 91717 — Recovery & Continuity

## Purpose
Recovery is the next Eternal Roadmap layer after Agent Operations. This implementation adds a member-scoped continuity checkpoint without pretending that a provider-level disaster restore has been executed.

## What is real
The omega_recovery_checkpoints table stores a server-generated summary for the authenticated member:
- persisted platform-event count and latest event timestamp;
- mission-state count, active count and completed count;
- saved Simulation Arena run count;
- Agent Operations audit count;
- schema version and SHA-256 snapshot digest.

The private checkpoint RPC derives member identity from auth.uid().

The server-governed RPC boundary is `private.omega_create_recovery_checkpoint(text)`; integrity verification is `private.omega_verify_recovery_checkpoint(uuid)`. These names are implementation evidence, not client-side authority claims. Browser input supplies only a bounded checkpoint key. Direct authenticated writes are revoked and RLS remains enabled.

## Integrity drill
The private verification RPC recomputes the digest from the persisted JSON snapshot and returns a boolean. A successful result means the stored checkpoint has not changed relative to its recorded digest.

## Explicit non-claims
This feature does not prove:
- provider backup availability;
- Point-in-Time Recovery configuration;
- cross-region database failover;
- Storage-object restoration;
- a production disaster restore;
- measured Recovery Time Objective;
- measured Recovery Point Objective.

The provider-level backup/restore path remains an owner/provider operations exercise.

## Member workflow
AUTHENTICATE -> CREATE CHECKPOINT -> SERVER SNAPSHOT -> HASH -> PERSIST -> VERIFY INTEGRITY -> EXPORT MANIFEST -> TEMPORAL REPLAY / EVIDENCE GRAPH

## Visual translation
The Recovery surface borrows the source collection's Crystal Omega, Ghost Firewall, concentric-ring and obsidian/cyan language. The artwork remains decorative reference material and never becomes a security credential.

## Closure evidence still required
1. Controlled provider-level backup/PITR restore drill in a non-production target.
2. Measured restore duration and recoverable-point age.
3. Storage objects, configuration and secret recovery runbook.
4. Repeat security/performance advisor review after recovery changes.
