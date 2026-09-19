# CI failure analysis — 2026-09-17

## Verified observation

The unified Contracts workflow runs `scripts/contract-suite.py` first. Because the step uses the default fail-fast behavior, later diagnostic gates can be skipped when the suite exits non-zero.

The 2026-09-16 run demonstrated this behavior: `migration-drift` failed, while the information-architecture and WebGL ownership steps were skipped.

## Required handling

- Do not suppress or downgrade `migration-drift`.
- Do not update `supabase/remote-migrations.json` without live Supabase verification.
- Run independent diagnostic gates with `if: always()` so their results remain visible even when the unified suite fails.
- Treat live migration state as UNVERIFIED until obtained from the Supabase project.

## Current blocker

The repository snapshot reports local-only migrations:

- `20260916204000_harden_stripe_webhook_events_rls.sql`
- `20260916210000_harden_stripe_webhook_events_rls.sql`

This document records the CI behavior and verification requirement; it does not claim that either migration has been applied remotely.
