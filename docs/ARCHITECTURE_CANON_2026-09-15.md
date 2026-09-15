# Ω SYD OMEGA 91717 — Architecture Canon

**Effective date:** 2026-09-15  
**Authority:** repository implementation + verified deployment evidence; attached specifications are requirements sources unless explicitly promoted by migration evidence.

## 1. Current production canon

The current production architecture is:

- framework-free/static web delivery
- Vercel as web deployment surface
- Supabase as production backend
- PostgreSQL + Row Level Security + Supabase Auth + Storage/Edge Functions where implemented
- source-controlled `public/` as the generated web delivery surface
- repository contract/audit scripts as release governance

This canon is intentionally preserved. A historical specification that describes a different stack does not authorize a destructive rewrite.

## 2. Historical target architecture

`SYD OMEGA 91717 - Master Prompt.txt` describes a React/Vite web application, Expo mobile application, Express gateway/services, Prisma, Redis, Docker and multiple services. That specification remains a requirements and future-migration source, not evidence that those systems are currently deployed.

Any adoption of those components must be additive or performed through an explicit migration with dependency tracing, compatibility checks, tests, rollback, and deployment evidence.

## 3. Product/module canon

`Ω SYD OMEGA 91717_Document.txt` defines the broad 18-module product surface and its intended routes and ownership hierarchy. The existence of a route or specification item is not proof that the underlying business capability is implemented.

Capability status must follow repository evidence and live verification. `verified: false` means the capability is not currently certified as production-verified.

## 4. 999-point blueprint classification

The 999-point blueprint is retained as a vision/R&D/lore source. It contains software concepts, speculative future technology, narrative world-building, financial concepts, legal concepts, biological/neural concepts, and operational claims.

Only concepts that are lawful, technically feasible, safe, and compatible with the production architecture may become implementation requirements.

The following are **not** production requirements merely because they appear in the blueprint:

- legal immunity or jurisdiction bypass mechanisms
- evasion of lawful regulation or subpoenas
- unauthorized surveillance or data extraction
- offensive cyber retaliation or logic-bomb behavior
- coercive psychological/neural manipulation
- unauthorized biological or genetic control
- autonomous financial predation or market manipulation
- claims of physical technologies that have not been independently established

Safe equivalents may be implemented as defensive security, privacy-by-design, compliance tooling, simulations, educational content, or clearly labelled fictional/R&D experiences.

## 5. Canon conflict policy

Where sources conflict, do not invent a third interpretation. Record the conflict and preserve the implementation that is currently verified and operational until a deliberate migration is approved.

Known examples include differing progression/gate counts and the historical React/microservice architecture versus the current static/Supabase production architecture.

## 6. Truth policy

The project uses four evidence classes:

1. **SPECIFIED** — required or described by a source document.
2. **IMPLEMENTED** — supported by repository/source evidence.
3. **DEPLOYED** — deployment integration reports success.
4. **VERIFIED** — the live production behavior has been directly exercised and evidence recorded.

A specification is never promoted directly to VERIFIED. A successful Vercel integration is never treated as proof of custom-domain runtime behavior. Historical verification statements are not current verification unless the current release has been exercised.

## 7. Change discipline

Every future change follows:

**INSPECT → TRACE → MODIFY ADDITIVELY → BUILD → STATIC AUDIT → RUNTIME TEST → PROVIDER/API CHECK → SECURITY CHECK → REGRESSION CHECK → COMMIT**

If a required verification cannot be performed, the item remains explicitly unverified.

## 8. Release blockers currently recognized

- production custom-domain health/runtime verification
- reliable successful current GitHub Actions execution
- Supabase leaked-password protection configuration
- current RLS regression evidence
- Auth/MFA/RBAC end-to-end evidence
- Stripe checkout/webhook/entitlement/idempotency evidence
- backup/restore evidence
- accessibility/performance evidence
- reconciliation of stale historical capability-verification statements

This document is a governance guardrail. It does not claim any blocker above is solved.
