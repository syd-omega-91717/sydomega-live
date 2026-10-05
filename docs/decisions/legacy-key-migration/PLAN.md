# Status: AWAITING-HUMAN-REVIEW

> Decision record for `grill-me-codex` Mode 1 (`type=auth` + `type=payments`), revised after
> Codex Round 2 (`CODEX_REVIEW.md`: REVISE, 1 blocker + 4 major + 3 minor, all folded in below).
> The reviewer was a subagent of the same session, not an independent party, so this record asks
> for a human verdict instead of claiming `APPROVED-BY-CODEX`. No code is written under it until
> the owner marks it `APPROVED-BY-HUMAN`. The dashboard actions (Phases 0, 3, 4) stay the owner's.
>
> **2026-10-05 — Phase A done.** The owner delegated the choice ("You choose what is better and improve the
> project"); Phase A, a standalone fix to an existing gap, was implemented and deployed (concierge v5) and
> verified live: the public publishable key and the legacy anon JWT now get 401 (`FIXES_LOG.md`, last entry).
> Phases 0–4 remain awaiting an explicit owner decision.
>
> **2026-10-05 — Phases 1 and 2 done (owner: "Go ahead").** `_shared/keys.ts` is in place; all 14
> functions read through it; the 7 live ones are redeployed and probed. Live findings that refine
> this plan: (1) R1 confirmed on the real gateway — `Bearer` equal to an `sb_` apikey reaches
> Postgres as that key's role, a mismatched `Bearer` is rejected as a malformed JWT; (2) R3
> answered — `SUPABASE_SECRET_KEYS` is injected but is `{}`, so **Phase 0 is not done**: every
> function runs on `legacy_fallback` for the secret key and `new` for the publishable key. When the
> owner creates the secret key, no redeploy is needed. Phase 3 stays blocked until all 7 log
> `secret:new`. Helper refinement beyond the plan: with no `default`, a single key of the right
> kind under any name is accepted, and the logged failure names the keys (never values).

# Plan: move Edge Functions off the legacy `anon` / `service_role` credentials

## Goal

Make a legacy `service_role` credential that leaked in project material outside the repository
(issue #682) **useless**, without breaking any live function.

A legacy `service_role` key is two things at once, and the goal needs both closed:

1. an **API key** (accepted in the `apikey` header) — closed by *deactivating the legacy API keys*;
2. a **JWT signed by the legacy JWT secret** (accepted in `Authorization: Bearer`) — closed only by
   *rotating to signing keys and revoking the legacy JWT secret*. Supabase: anon/service_role "are
   also valid JSON Web Tokens, signed by the legacy JWT secret", and revoking that secret "will
   reject them".

Today 13 functions read `SUPABASE_SERVICE_ROLE_KEY` and 13 read `SUPABASE_ANON_KEY`, so either
step now would break them. Supabase also ends legacy-key support at the end of 2026.

## Evidence (measured 2026-10-05)

| fact | evidence |
|---|---|
| Functions reading legacy keys | 14 source dirs: `agent-execute`, `checkout`, `concierge` (anon only), `concierge-orchestrator`, `event-ingest`, `graphify-ai-ingest`, `graphify-ai-query`, `growth-orchestrator`, `product-orchestrator`, `rankings`, `secrets-health`, `snapshot-leaderboard`, `stripe-webhook` (service only), `weekly-digest` |
| **Deployed live** among them | 7: `agent-execute`, `concierge`, `concierge-orchestrator`, `growth-orchestrator`, `product-orchestrator`, `secrets-health`, `stripe-webhook` (`list_edge_functions`) |
| Source-only (not deployed) | 7: `checkout`, `event-ingest`, `graphify-ai-ingest`, `graphify-ai-query`, `rankings`, `snapshot-leaderboard`, `weekly-digest` |
| Live `verify_jwt` | `true`: the six non-webhook functions. `false`: stripe-webhook (Stripe signs it) |
| supabase-js pins | `@2.112.4`: agent-execute, checkout, concierge, rankings, secrets-health, stripe-webhook. `@2.39.3`: the three orchestrators. `@2.39.8`: event-ingest, graphify-ai-* |
| Headers supabase-js sends | both 2.39.3 and 2.112.4 send `apikey: K` **and** `Authorization: Bearer K` to PostgREST/Auth/Storage; 2.112.4 omits the Bearer only for `functions.invoke` (`fetch.ts` at both tags) |
| Gateway rule for new keys | a `sb_` key in `Authorization: Bearer` is accepted **only if it exactly equals `apikey`** (Supabase changelog 29260); otherwise `Invalid JWT` |
| `verify_jwt` and new keys | "For migration compatibility, verify_jwt accepts publishable and secret keys on either header… The check alone doesn't authenticate a caller" (functions/auth-headers) |
| How new keys reach functions | platform injects `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS`, JSON objects keyed by name (`{"default":"sb_…"}`), alongside the legacy vars. No platform `SUPABASE_SECRET_KEY` var |
| Database callers | none: no `pg_cron`, 0 `net.http_*` callers, `vault.secrets` empty; the only `cron.schedule` is commented out (`migrations/0082_trial_917.sql:216`) |
| Client code | already on `sb_publishable_…`; 0 shipped files contain a legacy `eyJ…` key |
| Other callers | GitHub secret `SUPABASE_ANON_KEY` (`supabase-runtime-contract.yml`; `scripts/supabase-runtime-contract.py:101,125-130` already handles opaque keys). Unknown: Vercel env vars, the owner's local `scripts/deploy-phase5.sh` environment |
| Repo history | 0 service-role JWTs in 10,715 commits; `role: anon` JWTs only |

## Threat surface

| class | applies | why |
|---|---|---|
| auth: token validation | **yes — the blocker** | deactivating API keys does not stop the leaked key being honoured *as a JWT*; see Phase 4 |
| 6 unguarded callable | **yes** | `verify_jwt` accepts the public publishable key, so a function that never calls `auth.getUser()` is effectively public. `concierge` is in that state today (below) |
| auth: privilege escalation | yes | the admin client bypasses RLS; overriding its `Authorization` header with anything but the key itself breaks the gateway's equality rule or mixes identities |
| auth: credential handling | yes | `SUPABASE_SECRET_KEYS` must never be logged; parse failure must be visible but never echo the value |
| 8 missing edge cases / 2 silent failure | yes | a silent legacy fallback would make Phase 3 look safe while every function still depends on legacy keys |
| payments: signature / idempotency | yes, contained | stripe-webhook verifies the signature and idempotency **before** the key read (`stripe-webhook/index.ts:130-145`); a bad key fails `recordStripePayment` → 500 → Stripe retries, not a silent loss |
| module boundary (CI gates) | yes | five repo gates assert the literal legacy names and go red on Phase 1 |
| 7 races | low | both key sets work at once until Phase 3 |
| 1, 3, 4, 5 | no | no member-rendered data, RLS, schema, or client modules |

## Approach

**Phase A — close the existing concierge gap first (separate PR, independent of keys).**
`concierge/index.ts:68-71` only checks that `Authorization` starts with `bearer ` and then spends on
Anthropic. Since `verify_jwt` accepts the public publishable key and any old `role: anon` JWT from
repo history, anyone can drive Anthropic spend today. Gate it on `auth.getUser()` (401 on
failure) before any paid work. The other five `verify_jwt=true` functions already verify the user
first (agent-execute:20, secrets-health:135-138, orchestrators' `requireCaller`).

**Phase 0 — owner, dashboard, reversible.** Create `default` publishable and secret keys in
**Settings → API Keys** if absent; confirm `SUPABASE_SECRET_KEYS` appears under Edge Functions →
Secrets (closes R3). Nothing changes for any caller.

**Phase 1 — one shared helper, visible fallback.** Add `supabase/functions/_shared/keys.ts`:

- `secretKey()` / `publishableKey()` return `JSON.parse(SUPABASE_SECRET_KEYS).default` (resp.
  publishable) when present and well-formed; else the legacy var; else throw.
- Every call records its source. On the legacy branch it logs `KEY_SOURCE=legacy_fallback
  var=<name>` (never the value); on parse failure `KEYS_PARSE_FAILED var=<name>`. A
  `keySource()` export lets callers report it.
- **Admin-client contract:** `createClient(url, secretKey(), { auth: { persistSession:false } })`
  with **no** `global.headers.Authorization` override. supabase-js sends `Authorization` equal to
  `apikey`, which is exactly what the gateway accepts. User clients keep their shape:
  `createClient(url, publishableKey(), { global: { headers: { Authorization: <user JWT> } } })`.
- Each function swaps only its `Deno.env.get(...)` key reads for the helper. `verify_jwt`, the
  user-JWT client and the Stripe signature path do not change.
- **secrets-health:** add a probe entry fed by `secretKey()` (its `PROBES` map iterates env-var
  names, so the new key is otherwise never probed); fingerprint the single `default` key, not the
  JSON blob; report `key_source`.
- **CI gates updated in the same commit:** `scripts/omega-agent-operations-contract.py:8`,
  `scripts/edge-service-role-auth-audit.py:20`, `scripts/omega-event-fabric-contract.py:30`,
  `scripts/production-contract.py:79`, `scripts/release-gate.py:115` — each asserts the literal
  legacy name and must accept the helper instead, keeping its intent (admin key never client-side).
- **Source-only functions:** `snapshot-leaderboard:63` (`bearer === serviceKey`) and
  `weekly-digest:21` (`token === serviceRoleKey`) authorize by comparing a bearer to the key, not
  timing-safe. They get the helper swap but are marked **redesign before any deploy** (apikey
  header + timing-safe compare, or `@supabase/server` `auth:'secret'`). Not deployed here.

**Phase 2 — verify, then deploy the 7 live functions.**
- Type-check each changed function with `npx typescript@5` in a scratchpad, including the
  `../_shared/keys.ts` import (CLAUDE.md §7.6). A deploy through MCP `deploy_edge_function` must
  include `_shared/keys.ts` explicitly; the CLI bundles it.
- Deploy in blast-radius order — secrets-health → concierge → the three orchestrators →
  agent-execute → stripe-webhook last — calling each once with a real owner session and reading
  its admin-side effect; stripe-webhook gets a Stripe **test-mode** replay and its idempotency row
  is checked.

**Phase 3 — deactivate legacy API keys (owner, dashboard, reversible).** Only on **positive**
evidence: each of the 7 functions has logged or reported `key_source=new`; secrets-health shows
the new secret key live; the GitHub secret `SUPABASE_ANON_KEY` holds the publishable key; Vercel
env vars and the owner's deploy environment are checked for legacy keys; 24 h with no
`KEY_SOURCE=legacy_fallback` or `KEYS_PARSE_FAILED`. Absence of errors alone does not pass.

**Phase 4 — revoke the legacy JWT secret (owner, dashboard).** Move to asymmetric signing keys
(Settings → JWT Keys: create a standby key, rotate, then revoke the legacy secret). Required
whenever criterion 3b still returns rows after Phase 3. **Cost:** revoking the secret invalidates
every session signed with it, so every member, the owner included, signs in again. Schedule it.

## Key decisions

- **D1. Keep `verify_jwt` as it is, but do not treat it as authentication.** It keeps user session
  JWTs working through the migration; it does not authenticate (it accepts sb_ keys). Each function
  must call `auth.getUser()` before admin or paid work — hence Phase A. `@supabase/server` stays
  out of scope.
- **D2. Legacy fallback in the helper, but loud** (`KEY_SOURCE=legacy_fallback`), removed in a
  follow-up after Phase 3 holds.
- **D3. stripe-webhook last and minimal**; signature and idempotency code diff-frozen.
- **D4. The JWT-secret revocation is in scope as Phase 4**, not deferred — without it the leaked
  credential may still work as a Bearer JWT (Round 2 blocker). It is sequenced last because it
  signs everyone out.

## Risks / open questions

- R1. *Resolved by research:* supabase-js 2.39.x and 2.112.x both send Bearer = apikey, which the
  gateway accepts for sb_ keys. Still confirmed live in Phase 2, since it was read from source and
  the changelog, not tested.
- R2. *Resolved:* no function forwards the service key to another function. secrets-health:104
  sends it as Bearer alongside apikey (equal, accepted). The two key-comparison designs are the
  only coupling, both source-only (Phase 1 note).
- R3. `SUPABASE_SECRET_KEYS` on this free-plan project: documented as default, not confirmed for
  free tier — Phase 0 checks the dashboard.
- R4. Whether legacy JWTs stop working when only the API keys are deactivated is not documented;
  criterion 3b measures it instead of assuming.

## Out of scope

`@supabase/server` adoption; deploying the 7 source-only functions; redesigning the two
key-comparison functions; any RLS, schema or client change.

## Success criteria

1. Concierge returns 401 to a request bearing only the publishable key or an anon JWT (Phase A).
2. All 7 live functions redeployed on the helper, each exercised once, each reporting
   `key_source=new`.
3. stripe-webhook processes a test-mode replayed event exactly once.
4. After Phase 3, a REST request with the old `service_role` key as `apikey` returns 401.
5. **3b.** `apikey: <publishable>` + `Authorization: Bearer <legacy service_role JWT>` against
   `/rest/v1/profiles?limit=1` — run before Phase 3, after Phase 3, and after Phase 4. It must
   return no rows after Phase 4 at the latest.
6. The five CI gates pass with the helper; `ci-local.sh` green.
7. `git grep SUPABASE_SERVICE_ROLE_KEY supabase/functions` matches only `_shared/keys.ts` and
   secrets-health's labels for the legacy row (removed with the fallback).
