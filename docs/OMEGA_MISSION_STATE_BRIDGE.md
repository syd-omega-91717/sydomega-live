# OMEGA MISSION STATE BRIDGE

## Purpose

Expose persisted member mission evidence inside the existing Missions surface without
creating a second mission database or inventing completion state.

## Sources

- `public.tasks`: member-assigned or member-created task records.
- `public.task_completions`: persisted completion records scoped to the authenticated member.
- `public.evolution_events`: persisted progression events scoped to the authenticated member.

## State model

- `LIVE`: all declared reads succeeded.
- `PARTIAL`: one or more reads failed; missing state is not inferred.
- `UNAVAILABLE`: no shared authenticated Supabase client/session is available.

## Boundary

This is observational. The bridge does not create, complete, award, mutate, authorize,
or financially value a mission. Existing legacy mission presentation remains separate
until an authoritative mission-definition and transition model exists.

## Evidence ladder

`AUTHENTICATED → READ → PERSISTED → DISPLAYED`

A persisted row proves persistence, not business-rule correctness.
