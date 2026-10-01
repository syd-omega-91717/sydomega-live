# Ω SYD OMEGA 91717 — External Runtime Findings — 2026-10-01

This file records public, unauthenticated observations from the deployed
sydomega.com surface. It is evidence, not a substitute for authenticated
browser, Vercel, Supabase, Stripe, or owner-role verification.

## Verified observations

| Surface | Observation | Meaning | Action |
|---|---|---|---|
| `https://sydomega.com/` | HTTP 200 | Production web surface is reachable | Keep release smoke |
| Homepage | Viewport metadata present | Mobile layout has the required viewport contract | Continue device/browser testing |
| Homepage | 12 portal/world destinations are linked | The visual atlas is connected to real routes | Audit route-level auth and errors |
| Homepage | Offline/cache state is explicitly rendered | Offline UX exists as a product state | Test reconnect/sync behavior |
| `/control-plane` | HTTP 200 without authentication | Owner Deck HTML is publicly retrievable | Treat as a P1 authorization/surface-hardening review |
| `/control-plane` | Public page renders inventory/realms/motion/duplicates/audit controls | Owner-facing operational metadata is exposed at presentation layer | Move privileged operational diagnostics behind a server-enforced owner boundary if they expose non-public information |
| `/venture-pipeline` | Request resolves to member-access/account surface | Existing access redirect/guard is active for this route | Add authenticated E2E proof |
| `/web/templates/sovereign_health.html` | Request resolves to member-access/account surface | Destructive restoration surface is not directly exposed to the unauthenticated request | Add authenticated owner-only destructive-action test |
| `/budget` | HTTP 200; page explicitly states browser-only storage | Current budget implementation is local/browser state, not account-synchronized finance | Do not present it as synchronized financial state; migrate only if product requirements demand persistence |

## Security interpretation

The most important finding is not that the site is reachable; it is that
**route reachability and data authorization are separate contracts**.

The repository already documents this distinction. The deployed Owner Deck
should therefore be classified as:

**PUBLIC PRESENTATION → OWNER METADATA REVIEW REQUIRED → DATA AUTHORIZATION MUST
REMAIN SERVER-SIDE.**

No destructive action was observed in the unauthenticated control-plane
content during this check. This does not prove that every linked route or API
endpoint is authorized correctly.

## Next verification

1. Authenticated owner browser test for `/control-plane`.
2. Authenticated non-owner test proving owner diagnostics are denied.
3. Direct API tests for every control-plane data source.
4. Test destructive recovery actions with a non-owner and unauthenticated
   session; both must be denied.
5. Record Vercel deployment ID and production alias after connected-provider
   authorization is restored.
6. Exercise Supabase RLS policy semantics for owner/operator/member roles.
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
