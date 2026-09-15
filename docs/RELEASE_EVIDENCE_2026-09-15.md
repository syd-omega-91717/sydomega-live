# Ω SYD OMEGA 91717 — Release Evidence — 2026-09-15

## Purpose

This file records observed release evidence without converting incomplete evidence into a production-certification claim.

## Observed source state

- Repository: `syd-omega-91717/sydomega-live`
- Default branch: `main`
- Latest source SHA reviewed: `ec58ff48cab2a343ee25d6d9b77955ad1f7ccc58`
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

## Observed live deployment signal

The Production Smoke run for source SHA `ec58ff48cab2a343ee25d6d9b77955ad1f7ccc58` completed successfully.

Observed on 2026-09-15:

- `https://sydomega.com/healthz.html` returned **HTTP 200** with a non-empty response.
- `https://www.sydomega.com/healthz.html` returned **HTTP 200** with a non-empty response.
- `https://sydomega.com/` returned **HTTP 200** with HTML.
- `https://www.sydomega.com/` returned **HTTP 200** with HTML.
- The production smoke gate reported `PRODUCTION_SMOKE=PASS`.
- Canonical Supabase Auth transport returned **HTTP 401**.
- Canonical Supabase REST transport returned **HTTP 401**.
- The Supabase smoke gate reported `SUPABASE_ENDPOINT=REACHABLE`; the check treats 5xx as failure, so 401 is interpreted as a reachable authenticated boundary rather than successful unauthenticated application access.

These checks establish current external reachability and selected boundary behavior. They do **not** prove every application capability, database workflow, payment flow, AI integration, authorization path, recovery procedure, or business rule is production-correct.

## Current security state

The current Supabase Security Advisor reports exactly one remaining warning:

- `auth_leaked_password_protection` — Leaked Password Protection is disabled.

This is an external Supabase Auth configuration item and is **not claimed fixed** by repository changes. GitHub issue #375 tracks the required provider-side remediation and verification.

## Capability evidence boundary

The capability registry explicitly requires live verification before a capability can be considered `VERIFIED`. Several registry entries retain historical verification text from 2026-08-30 while their machine-readable `verified` field remains `false`. Historical statements are not interpreted as current production verification.

The capability-evidence freshness gate detects stale evidence that is incorrectly described as current. It does not rewrite historical evidence or promote capabilities automatically.

## Open verification gates

The following remain open until directly exercised and recorded with sufficient evidence:

- Supabase Security Advisor = zero warnings.
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

> The current `main` commit `ec58ff48cab2a343ee25d6d9b77955ad1f7ccc58` has a passing repository release contract and a successful production smoke verification of both custom-domain front doors, both health endpoints, and the canonical Supabase transport boundaries. The platform is **not yet fully production-certified** because security, business-flow, capability, recovery, accessibility/performance, and broader end-to-end verification gates remain open.
