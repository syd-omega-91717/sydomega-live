# SYD OMEGA 91717 — Continuous Improvement Operating System

## Purpose

This document turns the platform's continuous-improvement directive into a repeatable engineering control loop.

## Release loop

1. Discover — inspect source, runtime evidence, incidents, user friction, security findings, and dependency changes.
2. Classify — separate verified implementation, partial implementation, specification, external dependency, and blocked capability.
3. Prioritize — security, correctness, availability, data integrity, and user-critical paths precede cosmetic work.
4. Design — prefer the smallest architecture that solves the verified problem while preserving the current static/Supabase boundary.
5. Implement — isolate changes, preserve backward compatibility, and fail closed for privileged operations.
6. Test — syntax, unit, integration, artifact, security, accessibility, and production-path checks as applicable.
7. Observe — capture privacy-safe errors, latency, availability, and deployment evidence.
8. Release — only after automated gates pass; production verification remains distinct from repository verification.
9. Learn — record the result, regressions, and next improvement candidate.

## Capability lanes

- Experience: navigation, accessibility, responsive behavior, motion, localization, PWA.
- Application: module contracts, forms, workflows, error states, permissions.
- Intelligence: agent registry, model routing, retrieval, provenance, policy firewall, proof/evidence.
- Data: schema, migrations, RLS, indexes, retention, backup and recovery evidence.
- Operations: CI, artifact reproducibility, deployment controls, observability, incident readiness.
- Trust: threat modeling, secure supply chain, privacy, compliance, auditability.
- Business: subscriptions, marketplace, referrals, analytics, enterprise/government tenancy.

## Non-negotiable controls

- Never commit production secrets.
- Never cache authentication or sensitive API responses in the offline shell.
- Never grant privileged agent actions without an explicit policy boundary.
- Never describe an unverified specification as a production capability.
- Never mass-delete database indexes without workload evidence.
- Never introduce a new framework solely for appearance when the existing architecture can deliver the requirement.
- Every new external integration must have a clear owner, permission boundary, failure mode, removal path, and test coverage.

## Evidence states

`VERIFIED` means executable evidence exists for the claimed behavior.
`PARTIALLY_VERIFIED` means some but not all required evidence exists.
`UNVERIFIED` means the capability is specified or wired but not proven in the target environment.
`BLOCKED` means an external permission, credential, provider limit, or environment prevents verification.
`FAILED` means an executable check demonstrated incorrect behavior.

## Definition of done

A capability is complete only when implementation, integration, security boundary, tests, documentation, and relevant production evidence are present. A passing repository build alone does not certify the live service.
