# Ω SYD OMEGA 91717 — External Runtime Findings — 2026-10-01

These are public unauthenticated observations from sydomega.com. They are
evidence, not substitutes for authenticated browser, Vercel, Supabase, Stripe,
or owner-role verification.

| Surface | Observation | Action |
|---|---|---|
| `/` | HTTP 200; viewport metadata present | Continue desktop/mobile browser smoke |
| Homepage | 12 portal/world destinations are linked | Audit route-level auth and errors |
| Homepage | Offline/cache state is explicitly rendered | Test reconnect/sync behavior |
| `/control-plane` | HTTP 200 without authentication | P1 authorization/surface-hardening review |
| `/control-plane` | Inventory, realms, motion, duplicates and audit controls render publicly | Keep operational diagnostics behind server-enforced owner boundaries if non-public data is exposed |
| `/venture-pipeline` | Unauthenticated request resolves to member-access/account | Add authenticated E2E proof |
| `/web/templates/sovereign_health.html` | Unauthenticated request resolves to member-access/account | Add authenticated owner-only destructive-action test |
| `/budget` | HTTP 200 and explicitly says data is stored only in this browser | Do not represent it as synchronized financial state |

## Security interpretation

Route reachability and data authorization are separate contracts.

The Owner Deck should be treated as:

**PUBLIC PRESENTATION → OWNER METADATA REVIEW REQUIRED → DATA AUTHORIZATION MUST REMAIN SERVER-SIDE.**

No destructive action was observed in the unauthenticated control-plane content
during this check. That does not prove every linked route/API is authorized.

## Required next tests

1. Authenticated owner browser test for `/control-plane`.
2. Authenticated non-owner denial test for owner diagnostics.
3. Direct API authorization tests for every control-plane data source.
4. Denial tests for destructive recovery actions.
5. Record Vercel deployment ID and production alias after provider authorization is restored.
6. Exercise Supabase RLS semantics for owner/operator/member roles.
