# SYD OMEGA 91717 — Platform Completion Matrix

This is an execution matrix, not a marketing checklist. A row may only move to VERIFIED when the required evidence exists.

| Domain | Required completion evidence |
|---|---|
| Identity/Auth | login/session lifecycle, approval gate, authorization tests, recovery/error paths |
| Data | canonical migrations, constraints, RLS, indexes, backup/restore evidence |
| Storage | upload/download/delete policies, size/type validation, ownership tests |
| Edge Functions | deployed function, auth boundary, timeout/error handling, invocation evidence |
| Notifications | authorized write path, delivery/read state, failure/retry behavior |
| Transactions | canonical schema, idempotent write path, authorization, reconciliation, tests |
| Wallets | balance derivation, immutable ledger semantics, authorization, reconciliation, tests |
| AI | provider boundary, secret isolation, structured output validation, timeout/cost controls, evaluation |
| Agents | tool permissions, execution limits, audit trail, human approval for consequential actions |
| Search/RAG | indexing, retrieval authorization, provenance, freshness and deletion behavior |
| Marketplace | catalog, order/payment state machine, authorization, fulfillment, reconciliation |
| Publishing | draft/review/publish lifecycle, asset validation, rollback/versioning |
| Social/Family | ownership/membership authorization, mutation policies, moderation/failure states |
| Analytics | event schema, privacy boundary, aggregation, retention, dashboard integrity |
| Security | headers, XSS/IDOR/CSRF review, secret scan, RLS/advisors, upload hardening |
| Accessibility | keyboard, focus, semantics, contrast, reduced motion, responsive/readability tests |
| Performance | asset budget, query budget, pagination, N+1 detection, runtime smoke evidence |
| Resilience | timeout/retry/degraded states, idempotency, dependency failure tests |
| Observability | structured operational telemetry, correlation, actionable error evidence |
| Delivery | CI gates, deployment verification, rollback path, route/asset/PWA verification |
| Governance | audit trail, privileged-action controls, policy/version evidence |
| Interoperability | stable data/API contracts, import/export, version compatibility |

## Evidence rule

`BUILT` means source implementation exists. `CONNECTED` means dependencies are wired. `PERSISTED` means real data paths work. `SECURED` means authorization/security controls are verified. `TESTED` means automated/runtime evidence exists. `DEPLOYED` means the intended production artifact is live. `VERIFIED` requires end-to-end evidence.

No green checkbox is allowed to represent unavailable provider evidence.

## Continuous discovery

Before declaring the matrix complete, inspect the repository for new routes, modules, database objects, Edge Functions, external providers, workflows, and user-visible actions. Newly discovered capabilities must enter this matrix before release.
