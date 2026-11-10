# Ω Observatory Evidence Console

## Purpose

Extend the existing owner-only observatory.html without creating a duplicate operations dashboard or changing provider-side state.

The console visualizes config/omega-production-10-10-evidence-gate.json as a repository-declared evidence map. It is not a live health check, uptime monitor, deployment probe, Supabase query, payment test, or security scan.

## Data and truth contract

- Source: /config/omega-production-10-10-evidence-gate.json.
- Source values are displayed as repository declarations.
- PASS, PARTIAL, PENDING, and BLOCKED are preserved.
- Unknown statuses fail closed to UNVERIFIED.
- The existing vercel_production gate is not presented as a Cloudflare production verdict. It is relabelled Cloudflare production proof and shown as REVIEW REQUIRED because the current README identifies Cloudflare Pages as production while the gate is Vercel-specific.
- The source does not encode a snapshot timestamp; the interface says so.
- The console never writes to Supabase and never changes the existing uptime or SLO fields.

## Interface

- High-contrast Ω evidence constellation using lightweight inline SVG.
- Summary counts and expandable evidence requirements.
- Mobile-first one-column control list with accessible native details disclosure.
- Reduced-motion support.
- Links to the existing Owner Deck and GOVERN workspace.
- No new package dependencies, framework, database table, migration, or provider secret.

## Verification

Run:

python -m unittest scripts.tests.test_observatory_evidence_console -v

The existing uptime truth contract remains in force:

python -m unittest scripts.tests.test_uptime_truth_contract -v

## Out of scope

This change does not certify Cloudflare, Supabase, Stripe, uptime, backups, SLOs, MFA, or live security posture. Those require provider-backed evidence and separately approved operational work.
