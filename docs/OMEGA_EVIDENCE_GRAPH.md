# Ω SYD OMEGA 91717 — Evidence Graph Bridge

## Purpose
Provide a read-only member-scoped bridge between existing persisted evidence sources and the World/Continuity experience.

## Sources
- omega_platform_events
- omega_platform_evidence
- task_completions
- graph_evidence

No new database model is introduced.

## Contract
The surface must derive the member identity from the authenticated Supabase session. It may read only records authorized for that member. It must distinguish unavailable/partial/live states and must not convert persisted records into unsupported claims.

## Evidence chain
EVENT → CAPABILITY EVIDENCE → TASK → GRAPH EVIDENCE → EXPERIENCE

The chain is observational. It does not award achievements, modify progression, authorize users, create financial value, or mint assets.

## Evolution
The next mission-state layer may reference this evidence bridge, but authoritative completion rules must remain server-side and explicitly authorized.
