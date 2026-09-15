# Ω SYD OMEGA 91717 — Release Evidence — 2026-09-15

## Purpose

This file records observed release evidence without converting incomplete evidence into a production-certification claim.

## Observed source state

- Repository: `syd-omega-91717/sydomega-live`
- Default branch: `main`
- Latest source SHA reviewed: `14234b138ab57d3d6ca5f2f9fa33c6661648f82d`
- Current architecture: framework-free static delivery through Vercel with Supabase as the production backend.
- The release-contract audit distinguishes repository-contract PASS from live provider/runtime verification.
- The release contract scans shipped source and generated `public/` output for non-canonical Supabase endpoints and checks shipped web files for privileged credential patterns.
- Local MCP configuration (`.mcp.json`) is intentionally excluded from the browser-delivery host audit because it references the Supabase MCP control-plane endpoint rather than a browser runtime endpoint.
- The production contract includes capability-registry, evidence-freshness, module-contract, evidence-audit, JavaScript syntax and configuration checks.

## Current release-contract correction

The first Production Smoke run for commit `080f8347d1656b4c40d62834dd1727cace431fac` exposed two repository-contract defects:

1. `.mcp.json` was incorrectly classified as shipped source because it contains the legitimate `https://mcp.supabase.com/mcp` control-plane endpoint.
2. The canonical present-concept document did not contain the exact invariant phrase `framework-free static architecture`, even though it described the same architecture semantically.

These were corrected additively in commits `66cc7f1db1c6fe15a27a59cd61b9fd7a4516f7a1` and `ec58ff48cab2a343ee25d6d9b77955ad1f7ccc58`. The release audit then returned **zero errors / zero warnings** on the production-smoke run.

## Free-tier password-breach compensating control

The current Supabase Free organization cannot enable the provider-side `auth_leaked_password_protection` setting. The repository therefore implements a documented compensating control rather than falsely claiming the Supabase finding is resolved.

Commit `ecbc8919419352053f56f258d7dbea9742e00783` adds:

- `docs/security/PASSWORD_BREACH_COMPENSATING_CONTROL.md` — records the threat model, privacy boundary, failure semantics and closure criteria.
- `scripts/tests/test_omega_password_guard.js` — deterministic checks for strength validation, five-character HIBP k-anonymity requests, positive compromised-password detection, clean results and unavailable-service semantics.
- The existing `omega-password-guard.js` remains the shared browser-side control for the account and password-recovery password-setting paths.
- Commit `14234b138ab57d3d6ca5f2f9fa33c6661648f82d` fixes the regression test's Node `vm` cross-realm assertion behavior without weakening the assertions.

The control uses the HIBP Pwned Passwords range model: the browser hashes locally, sends only the first five SHA-1 characters, and compares returned suffixes locally. The full password is not sent to HIBP. This is a **compensating control, not an equivalent replacement for Supabase's server-side Auth feature**. Direct callers of Supabase Auth can bypass a browser-only control.

Accordingly:

- `COMPENSATING_CONTROL=PASS` must remain distinct from `SUPABASE_ADVISOR=PASS`.
- `auth_leaked_password_protection` remains an external/unresolved Supabase Security Advisor finding on Free.
- No SQL, RLS policy, application flag, or documentation may represent the provider finding as fixed.
- The project does not need to purchase Pro solely to obtain a truthful repository-side password-breach control, unless server-side enforcement against direct Auth callers becomes a required business/security policy.

## Current GitHub Actions and deployment evidence

A fresh push-triggered verification set for the current `main` SHA `14234b138ab57d3d6ca5f2f9fa33c6661648f82d` completed successfully on 2026-09-15. The observed runs include:

- CI run `34940165487` — **success**.
- Capability Evidence run `34940165617` — **success**.
- Repository Integrity run `34940165486` — **success**.
- Production Contract run `34940165651` — **success**.
- Omega Release Readiness run `34940165623` — **success**.
- Supabase Runtime Contract run `34940165553` — **success**.
- Production Smoke run `34940165539` — **success**.
- Production Surface Verification run `34940165661` — **success**.
- Vercel Production run `34940165662` — **success**.

The CI run includes the password-breach guard regression test and the repository's broader architecture, security, migration, capability, reachability, commerce, resilience, credential-scan and configuration contracts. The Capability Evidence run completed its headless capability-entrypoint runtime audit. The Repository Integrity run completed the production artifact build and emitted-artifact validation.

## Current production smoke evidence

Production Smoke run `34940165539` checked out the exact current SHA `14234b138ab57d3d6ca5f2f9fa33c6661648f82d`.

The release-contract audit returned:

- architecture: `current framework-free static + Vercel + Supabase`
- errors: `0`
- warnings: `0`
- `RELEASE_CONTRACT=PASS`

Vercel propagation checks observed:

- `https://sydomega.com/healthz.html` — HTTP **200**, 991 bytes.
- `https://www.sydomega.com/healthz.html` — HTTP **200**, 991 bytes.
- `VERCEL_PROPAGATION=READY`

Production HTTP smoke observed:

- `https://sydomega.com/` — HTTP **200**, HTML.
- `https://www.sydomega.com/` — HTTP **200**, HTML.
- `https://sydomega.com/healthz.html` — HTTP **200**, HTML.
- `https://www.sydomega.com/healthz.html` — HTTP **200**, HTML.
- `PRODUCTION_SMOKE=PASS`

Canonical Supabase transport observed:

- `https://ydqhzvvoyufiiqvzcjns.supabase.co/auth/v1/health` — HTTP **401**.
- `https://ydqhzvvoyufiiqvzcjns.supabase.co/rest/v1/` — HTTP **401**.
- `SUPABASE_ENDPOINT=REACHABLE`.

The smoke gate treats 5xx responses as failure; HTTP 401 is interpreted as a reachable authenticated boundary, not successful unauthenticated application access.

The separate Production Surface Verification workflow for the same SHA also completed successfully. It independently verified the configured production site, Supabase Auth transport and security headers when the site was reachable.

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
- Current live RLS regression state against the live database.
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

> The current `main` commit `14234b138ab57d3d6ca5f2f9fa33c6661648f82d` has a fresh green GitHub verification set, a successful Vercel Production workflow, and a successful production smoke that directly observed both custom-domain front doors, both health endpoints, and the canonical Supabase transport boundaries. The password-breach compensating control is tested and documented without claiming to resolve Supabase's provider-level Security Advisor warning. The platform is **not yet fully production-certified** because security, business-flow, capability, recovery, accessibility/performance, and broader end-to-end verification gates remain open.
