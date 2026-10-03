# Ω SYD OMEGA 91717 — Platform Kernel

The Platform Kernel is the shared contract for turning many existing surfaces into one observable platform. It is additive: it does not replace the existing capability registry, object graph, event fabric or Supabase contracts.

## Layers

Experience → Platform Services → Intelligence Fabric → Data Plane → Trust & Control → Economy

## Capability lifecycle

SPECIFIED → IMPLEMENTED → TESTED → RUNTIME VERIFIED → PRODUCTION VERIFIED → OBSERVED → SCALED

BLOCKED and PARTIAL are explicit states and are never silently treated as healthy.

## Evidence bridges

The kernel now connects to the repository's existing systems:

- docs/capabilities/registry.json — detailed capability contracts and live-verification evidence.
- config/omega-object-model.json + config/omega-object-contract.schema.json — canonical object identity, truth and lineage.
- docs/OMEGA_EVENT_FABRIC.md + scripts/omega-event-fabric-contract.py — authenticated event ingestion and race-safe idempotency.
- docs/PRODUCTION_TRUTH_MATRIX.md — production proof ledger; open provider/runtime gates remain visible.
- scripts/platform-kernel-contract.py — deterministic cross-contract gate.

The kernel deliberately does not create a second capability registry, object model or event store.

## Proof gates

The manifest records explicit open production gates including Supabase Auth security configuration, RLS semantic regression, MFA/RBAC E2E, Stripe lifecycle/idempotency, backup/restore, critical mobile/desktop journeys, accessibility/performance and fresh production smoke evidence.

These are evidence declarations, not synthetic health metrics. A blocked gate is displayed as blocked until the source evidence changes.

## Rules

1. Every capability has one stable ID and one canonical product route.
2. Registry-linked capabilities must reference an existing registry ID.
3. A route becomes observed only after a browser probe succeeds.
4. Missing data is missing; it is never replaced with zero.
5. Presentation never fabricates metrics.
6. Browser-shipped code cannot prove backend health.
7. Production verification requires deployment/provider evidence and remains separate from local/browser checks.
8. Consequential writes remain behind existing server/RLS/policy boundaries.
9. New platform modules register here before becoming another isolated subsystem.

This kernel is the control-plane foundation for the next platform stages: reliability, governed intelligence, financial integrity, developer APIs and ecosystem expansion.
