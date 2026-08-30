---
name: omega-platform
description: "Cross-discipline production engineering skill for SYD OMEGA 91717. Use for every substantial change across GitHub, Vercel/static delivery, Supabase/Postgres/Auth/Storage/Edge Functions, AI/agents, security, accessibility, performance, testing, observability, data lifecycle, and release operations."
metadata:
  author: SYD OMEGA engineering
  version: "1.0.0"
---

# Ω Platform Engineering Skill

## Mission
Build the actual platform, not an aspirational specification. Every change must improve a real capability, reliability, security, operability, user experience, or delivery path.

## Operating loop
1. Inspect the current repository and existing contracts before editing.
2. Identify the smallest safe production change that closes a real gap.
3. Implement the change in the repository's actual architecture; do not introduce a framework merely for fashion.
4. Add or update deterministic verification.
5. Verify locally where possible and use provider tooling when authorized.
6. Record evidence and remaining uncertainty.
7. Merge only when blocking checks pass.

## Truth protocol
Never label a capability VERIFIED from source inspection alone. Use these states:
STATIC → LOCAL_ONLY → PARTIAL → BUILT → CONNECTED → PERSISTED → SECURED → TESTED → DEPLOYED → VERIFIED.
Provider access, runtime behavior, database state, and deployment state are evidence boundaries. If unavailable, say UNVERIFIED rather than guessing.

## Architecture rules
- Preserve the current framework-free static architecture unless a measurable requirement justifies migration.
- `bg.js` is critical infrastructure: changes require syntax, asset, and runtime verification.
- Shared behavior belongs in shared modules; do not create page-specific duplicates of auth, navigation, telemetry, design tokens, or data-guard behavior.
- Supabase RLS is an authorization boundary, not merely a database convenience.
- Privileged operations belong server-side/Edge Function/RPC with explicit authorization checks.
- Never expose service-role or secret credentials to browser code.
- Migrations are immutable production history; never rewrite already-applied migrations.

## GitHub engineering
- Work in a dedicated branch for non-trivial changes.
- Keep commits narrowly scoped and reversible.
- Review the actual diff before merge.
- Use CI as evidence; never assume a workflow passed because a file exists.
- Do not weaken a failing gate to obtain green status.
- Prefer automated detection over documentation-only promises.

## Vercel/static delivery
Verify:
- every referenced local asset exists;
- every public route has a deterministic fallback where appropriate;
- security headers are intentional and compatible with the actual application;
- redirects/rewrites do not create loops;
- PWA manifest and service-worker assets resolve;
- cache policy does not cache user-specific responses;
- production behavior is tested in a real browser when possible.

## Supabase/Postgres
For any schema/auth/storage/function change:
- inspect current schema and migration history first;
- use RLS on exposed user-data tables;
- use `TO authenticated`/`TO anon` plus explicit ownership/authorization predicates;
- UPDATE policies require both `USING` and `WITH CHECK` where ownership can change;
- do not authorize from user-editable `raw_user_meta_data`;
- minimize SECURITY DEFINER usage; when required, pin `search_path`, validate `auth.uid()`, and restrict EXECUTE;
- secure Storage policies for SELECT/INSERT/UPDATE as required by the operation;
- add indexes for high-cardinality filters and foreign keys where justified;
- check advisors after security/performance schema changes;
- verify writes and reads with real queries when provider access exists.

## Data integrity
Every important write path should consider:
- idempotency;
- unique constraints;
- transaction boundaries;
- concurrency/race conditions;
- partial failure and retry behavior;
- audit trail;
- timestamps and actor identity;
- deletion/retention semantics;
- import/export compatibility.

## AI and agent engineering
AI features must have:
- explicit model/provider boundary;
- secret isolation;
- timeout and retry policy;
- cost/token limits;
- structured outputs where machine consumption occurs;
- validation before persistence or execution;
- prompt-injection resistance for retrieved content;
- provenance for important generated results;
- fallback/degraded behavior;
- evaluation fixtures for critical workflows;
- human approval for consequential actions.

## Security
Continuously check:
- XSS/HTML injection;
- CSRF where cookie-authenticated mutations exist;
- IDOR/BOLA;
- broken access control;
- secret exposure;
- unsafe redirects;
- CSP/header regressions;
- upload MIME/size/path traversal controls;
- rate limits and abuse controls;
- dependency/supply-chain risks;
- auditability of privileged actions.

## UX/accessibility
Every new or materially changed UI should be:
- keyboard operable;
- screen-reader understandable;
- readable at mobile widths and zoom;
- clear about loading, empty, success, and failure states;
- tolerant of slow/offline network conditions;
- consistent with existing shared visual ownership.

## Performance
Protect the critical path:
- avoid third-party CDN dependencies when a local vendored dependency is already the established architecture;
- avoid duplicate module loads;
- defer non-critical effects;
- minimize unnecessary queries and N+1 patterns;
- paginate unbounded data;
- use caching only with explicit invalidation semantics.

## Testing pyramid
Prefer, in order:
1. deterministic static checks;
2. unit/self-tests for reusable logic;
3. contract/schema tests;
4. browser/runtime smoke tests;
5. provider integration tests;
6. production verification.
A passing lower layer never substitutes for a missing higher layer.

## Observability
Critical operations should expose enough structured evidence to diagnose:
- request/correlation ID;
- actor;
- operation;
- outcome;
- latency;
- error class;
- provider dependency;
- retry count where applicable.
Never log secrets, tokens, credentials, or sensitive user content unnecessarily.

## Resilience
For every external dependency ask:
- What happens when it is slow?
- What happens when it returns an error?
- What happens when it is unavailable?
- What happens after a retry?
- Can the user recover without refreshing?
- Can the operation be safely repeated?

## Release gate
A release is not complete until blocking checks pass and all intended capabilities have evidence for their declared state. Provider-dependent work remains explicitly UNVERIFIED until provider-side evidence exists.

## Definition of done
A task is done only when the implementation, integration path, failure path, security boundary, verification, and release evidence are aligned. Documentation alone is never implementation.
