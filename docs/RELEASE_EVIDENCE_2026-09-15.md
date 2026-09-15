# Ω SYD OMEGA 91717 — Release Evidence — 2026-09-15

## Purpose

This file records observed release evidence without converting incomplete evidence into a production-certification claim.

## Observed source state

- Repository: `syd-omega-91717/sydomega-live`
- Default branch: `main`
- Latest source SHA reviewed: `ecbc8919419352053f56f258d7dbea9742e00783`
- Current architecture: framework-free static delivery through Vercel with Supabase as the production backend.
- The release-contract audit distinguishes repository-contract PASS from live provider/runtime verification.
- The release contract scans shipped source and generated `public/` output for non-canonical Supabase endpoints and checks shipped web files for privileged credential patterns.
- Local MCP configuration (`.mcp.json`) is intentionally excluded from the browser-delivery host audit because it references the Supabase MCP control-plane endpoint rather than a browser runtime endpoint.
- The production contract includes capability-registry, evidence-freshness, module-contract, evidence-audit, JavaScript syntax and configuration checks.

## Current release-contract correction

The first Production Smoke run for commit `080f8347d1656b4c40d62834dd1727cace431fac` exposed two repository-contract defects:

1. `.mcp.json` was incorrectly classified as shipped source because it contains the legitimate `https://mcp.supabase.com/mcp` control-plane endpoint.
2. The canonical present-concept document did not contain the exact invariant phrase `framework-free static architecture`, even though it described the same architecture semantically.

These were corrected additively in commits `66cc7f1db1c6fe15a27a59cd61b9fd7a4516f7a1` and `ec58ff48cab2a343ee25d6d9b77955ad1f7ccc58`. The release audit then returned **zero errors / zero warnings** on the new production-smoke run.

## Free-tier password-breach compensating control

The current Supabase Free organization cannot enable the provider-side `auth_leaked_password_protection` setting. The repository therefore implements a documented compensating control rather than falsely claiming the Supabase finding is resolved.

Commit `ecbc8919419352053f56f258d7dbea9742e00783` adds:

- `docs/security/PASSWORD_BREACH_COMPENSATING_CONTROL.md` — records the threat model, privacy boundary, failure semantics and closure criteria.
- `scripts/tests/test_omega_password_guard.js` — deterministic checks for strength validation, five-character HIBP k-anonymity requests, positive compromised-password detection, clean results and unavailable-service semantics.
- The existing `omega-password-guard.js` remains the shared browser-side control for the account and password-recovery password-setting paths.

The control uses the HIBP Pwned Passwords range model: the browser hashes locally, sends only the first five SHA-1 characters, and compares returned suffixes locally. The full password is not sent to HIBP. This is a **compensating control, not an equivalent replacement for Supabase's server-side Auth feature**. Direct callers of Supabase Auth can bypass a browser-only control.

Accordingly:

- `COMPENSATING_CONTROL=PASS` must remain distinct from `SUPABASE_ADVISOR=PASS`.
- `auth_leaked_password_protection` remains an external/unresolved Supabase Security Advisor finding on Free.
- No SQL, RLS policy, application flag, or documentation may represent the provider finding as fixed.
- The project does not need to purchase Pro solely to obtain a truthful repository-side password-breach control, unless server-side enforcement against direct Auth callers becomes a required business/security policy.

## Observed live deployment signal

The Vercel status for source SHA `ecbc8919419352053f56f258d7dbea9742e00783` reports **success** and `Deployment has completed`.

The preceding production-smoke release `ec58ff48cab2a343ee25d6d9b77955ad1f7ccc58` established the following observed front-door evidence on 2026-09-15:

- `https://sydomega.com/healthz.html` returned **HTTP 200** with a non-empty response.
- `https://www.sydomega.com/healthz.html` returned **HTTP 200** with a non-empty response.
- `https://sydomega.com/` returned **HTTP 200** with HTML.
- `https://www.sydomega.com/` returned **HTTP 200** with HTML.
- The production smoke gate reported `PRODUCTION_SMOKE=PASS`.
- Canonical Supabase Auth transport returned **HTTP 401**.
- Canonical Supabase REST transport returned **HTTP 401**.
- The Supabase smoke gate reported `SUPABASE_ENDPOINT=REACHABLE`; the check treats 5xx as failure, so 401 is interpreted as a reachable authenticated boundary rather than successful unauthenticated application access.

The new Vercel deployment is confirmed complete, but the new SHA must still receive its own full production-smoke workflow evidence before that evidence is promoted to a current release gate.

## Current security state

The current Supabase Security Advisor reports exactly one remaining warning:

- `auth_leaked_password_protection` — Leaked Password Protection is disabled.

This is an external Supabase Auth configuration item and is **not claimed fixed** by repository changes. GitHub issue #375 tracks the provider-side remediation and verification. The Free-tier compensating control described above reduces password-breach exposure through the platform's own password-setting UI but does not close the provider-level finding.

## Capability evidence boundary

The capability registry explicitly requires live verification before a capability can be considered `VERIFIED`. Several registry entries retain historical verification text from 2026-08-30 while their machine-readable `verified` field remains `false`. Historical statements are not interpreted as current production verification.

The capability-evidence freshness gate detects stale evidence that is incorrectly described as current. It does not rewrite historical evidence or promote capabilities automatically.

## Open verification gates

The following remain open until directly exercised and recorded with sufficient evidence:

- Supabase Security Advisor = zero warnings. **This remains provider-plan dependent while the project is on Free.**
- Current RLS regression state against the live database.
- Authentication/MFA/RBAC end-to-end flows.
- Stripe checkout, signed webhook, entitlement lifecycle and idempotency.
- Backup/restore exercise.
- Representative accessibility and performance checks.
- Full capability-by-capability production reconciliation.
- Mobile production track and other future-target requirements that are not part of the current static production architecture.
- Full end-to-end business workflow verification across the platform.

## Architecture boundary

The historical React/Vite + Express/microservices + Prisma + Expo Master Prompt remains a requirements/future-target source. The current production implementation remains framework-free static Vercel + Supabase. No rewrite is authorized merely to make the repository resemble the historical specification.

The 999-point blueprint is treated as a mixed vision/R&D/lore source. Concepts involving legal immunity, bypassing regulation, unauthorized surveillance, cyber retaliation, coercive control, biological/neural control, or autonomous financial predation are not treated as production implementation requirements.

## Non-conflict rule

No completion claim is made for an item above until appropriate evidence exists. Future changes must preserve the current canonical architecture, routes, data contracts, security boundaries and visual system unless an explicit migration is designed, tested and verified.

## Release interpretation

The current evidence supports this narrower statement:

> The current `main` commit `ecbc8919419352053f56f258d7dbea9742e00783` has been successfully deployed by Vercel and adds a tested/documented Free-tier password-breach compensating control without claiming to resolve Supabase's provider-level Security Advisor warning. The previous release has a passing repository release contract and successful production smoke verification of both custom-domain front doors, both health endpoints, and the canonical Supabase transport boundaries. The platform is **not yet fully production-certified** because security, business-flow, capability, recovery, accessibility/performance, and broader end-to-end verification gates remain open.
