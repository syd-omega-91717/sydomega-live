# Codex review — legacy key migration

Mode 1, `type=auth` + `type=payments`, threat model `.claude/skills/grill-me-codex/THREAT_MODEL.md`.

## Round 1 — draft (2026-10-05)

`PLAN.md` written from live evidence (functions list, `verify_jwt`, database callers, vault,
client keys, full-history secret scan). Status `REVISE`, with R1–R3 open.

## Round 2 — adversarial review (2026-10-05)

**Reviewer:** a separate subagent, given only the plan, the threat model and the function sources;
read-only, with web research. Not independent of this session, so the final verdict goes to a human.

**VERDICT: REVISE**

| # | severity | class | finding | evidence | resolution in PLAN.md |
|---|---|---|---|---|---|
| 1 | blocker | auth: token validation | Deactivating legacy API keys stops the leaked key as `apikey`, but it may still be honoured as a Bearer JWT signed by the legacy JWT secret | Supabase signing-keys doc: legacy keys "are also valid JSON Web Tokens… revoking the legacy JWT secret will reject them" | Goal split in two; **Phase 4** (signing keys + revoke legacy secret) brought into scope; criterion 3b measures it; sign-out cost recorded |
| 2 | major | 6 unguarded callable | `verify_jwt` accepts sb_ keys and "doesn't authenticate a caller"; concierge checks only the `bearer ` prefix before Anthropic spend | `concierge/index.ts:68-71`, spend ~:106; functions/auth-headers doc | **Phase A** — gate concierge on `auth.getUser()`, separate PR; D1 reworded |
| 3 | major | auth | Plan's header contract ("key on apikey, not Bearer") is false: supabase-js sends Bearer = apikey; the gateway accepts sb_ keys only when equal | supabase-js `fetch.ts` at v2.39.3 and v2.112.4; changelog 29260 | Contract restated as "Authorization equals apikey, no override"; evidence row corrected |
| 4 | major | 8 / 2 | Silent legacy fallback lets the Phase 3 gate pass while functions still depend on legacy keys | plan Phase 1/3 | Fallback logs `KEY_SOURCE=legacy_fallback`; Phase 3 needs positive `key_source=new` from all 7 |
| 5 | major | module boundary | Five CI gates assert the literal legacy names and go red on Phase 1 | `omega-agent-operations-contract.py:8`, `edge-service-role-auth-audit.py:20`, `omega-event-fabric-contract.py:30`, `production-contract.py:79`, `release-gate.py:115` | Listed in Phase 1, updated in the same commit; criterion 7 widened |
| 6 | minor | 8 | secrets-health's `PROBES` iterate env-var names, so the new key is never probed; fingerprinting the JSON blob reads every addition as a change | `secrets-health/index.ts:100-104,155-158` | Probe fed by `secretKey()`, fingerprint the `default` key |
| 7 | minor | 6 | snapshot-leaderboard and weekly-digest authorize by non-timing-safe bearer-equals-key comparison | `snapshot-leaderboard/index.ts:63`, `weekly-digest/index.ts:21` | Marked "redesign before deploy"; out of scope (source-only) |
| 8 | minor | 8 | MCP deploy must include `_shared/keys.ts` explicitly | deploy mechanics | Phase 2 note + type-check of the relative import |

**Confirmed fine:** stripe-webhook — signature and idempotency run before the key read
(`:130-145`); a bad key → 500 → Stripe retries.

**Spot-checked by the author:** findings 2, 5 and 7 re-read in source (concierge:68-71 and its
Anthropic call; the five gate lines; snapshot-leaderboard:63). All as reported.

**Research limits stated by the reviewer:** supabase.com and GitHub HTML are egress-blocked here;
docs were read from raw GitHub sources and search excerpts. The Supabase connector was
disconnected, so nothing was tested live — R1 and R4 are re-checked in Phase 2 / criterion 3b.

## Round 3 — revision

All eight findings folded into `PLAN.md`. No findings disputed.

## Final

`# Status: AWAITING-HUMAN-REVIEW` — the reviewer shares this session, so an `APPROVED-BY-CODEX`
from it would not be an independent verdict. Owner decision requested: approve Phases A–4 as
written (`APPROVED-BY-HUMAN`), or revise. Phase A is a standalone fix to an existing gap and can be
approved on its own.
