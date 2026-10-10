# Ω Production Convergence Wave

## Purpose

This wave closes the gap between a mature architecture and externally verifiable production readiness. It feeds explicit evidence into the existing Ω Production Assurance Plane; it does not replace canonical identity, event, evidence, mission, capability, lineage or deployment systems.

## Rules

1. Repository implementation is not provider configuration.
2. Provider configuration is not production evidence until independently verified.
3. Missing external evidence is `UNVERIFIED`, never silently treated as success.
4. Runtime capabilities without required controls are `BLOCKED`.
5. `SIMULATED`, `LORE`, and `DESIGN_PROPOSAL` can never be promoted to `LIVE`.
6. Secret values must never be stored in this contract, GitHub issues, documentation or chat.
7. Owner-side actions remain open evidence requirements; the repository must not pretend they happened.
8. Existing canonical systems remain authoritative.

## P0 gates

### Credential containment

Closure requires provider-side rotation/revocation evidence, repository history scanning, and a secret lifecycle record.

### Owner MFA

Closure requires a verified MFA factor, enforcement evidence and a tested recovery path. The repository cannot enroll a user's authenticator on their behalf.

### Leaked-password protection

Closure requires the Supabase Auth setting to be enabled and Security Advisor to show no remaining finding for leaked-password protection.

### Commerce reality

A live payment claim requires:

checkout -> webhook -> signature verification -> idempotency -> settlement -> entitlement -> event -> evidence -> audit

Negative paths include invalid signature, duplicate delivery, failure, cancellation/refund and replay.

## P1 gates

### Semantic memory

Closure requires an approved embedding provider, versioned vector schema, authenticated generation, retries/idempotency, provenance, expiry/retention enforcement, groundedness evaluation and explicit `UNAVAILABLE` behavior.

### Ω LIFE persistence

Life-state claims require server-authoritative persistence, RLS/privacy controls, events, evidence/lineage and export/deletion behavior.

### Service execution

A service resolves through:

service -> capability -> route -> authoritative data -> policy -> event -> evidence -> verification

A task resolves through:

task -> authorization -> action -> event -> evidence -> mission state -> reward/progression

### Operational recovery

A resilience claim requires backup evidence, restore exercise, migration replay and an RTO/RPO record.

## Current truth boundary

The known external gates remain unclosed until evidence exists:

- credential provider rotation
- owner MFA enrollment
- Supabase leaked-password protection
- production Stripe webhook proof
- semantic memory activation

The correct owner action is to complete provider/account operations and then provide non-secret evidence for the release evidence process.

## Completion standard

The wave is complete only when every required gate is `PASS` and the resulting evidence is traceable to the tested production commit.

`UNVERIFIED` and `BLOCKED` are valid states and remain visible until their evidence exists.
