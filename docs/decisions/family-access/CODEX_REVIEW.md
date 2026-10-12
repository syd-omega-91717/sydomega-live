# Codex review: family access

## Round 1 — VERDICT: REVISE (2026-10-12)

An independent reviewer agent read PLAN.md, the threat model, CLAUDE.md §5/§8.1 and the
migrations defining `public_leaderboard`, `guard_profile_privileges` and the leaderboard and
feed functions. It edited no file.

| # | sev | finding | resolution |
|---|---|---|---|
| 1 | major | "exactly two paths" was not an enumeration; `get_points_leaderboard` and `get_activity_feed` also return names | re-enumerated live (table in PLAN round 1). Both are SECURITY INVOKER under self-or-owner RLS; the predicate is added anyway and the probe asserts null names |
| 2 | major | `leaderboard_snapshots` copies names; filtering only at write leaves earlier rows | the grant deletes the target's snapshot rows; the Edge Function filters on write |
| 3 | major | the repo defines `public.public_leaderboard`, live has `private.`; owner helpers inconsistently named | bodies are taken from live `pg_get_functiondef` at apply time |
| 4 | major | rpc-consolidation gate may fail on redefinitions | run it on the branch before claiming success |
| 5 | minor | guard is BEFORE UPDATE only; spec the check as `is distinct from` | adopted; the INSERT invariant is recorded |
| 6 | minor | `dob` is member-writable, so the age check is attestation | wording changed; dob stored in the audit |
| 7 | minor | `on delete set null` side effect; re-link overwrite | refuse `already_linked`; deletion side effect accepted and recorded |
| 8 | minor | REVOKE on `private.*` too; schema USAGE; qualified names | adopted |
| 9 | minor | implicit triggers fire on approval | the probe asserts no member-visible write |
| 10 | minor | public `activity_feed` rows show family activity by user_id | acknowledged in PLAN |

Next: round 2 review of the revised PLAN, then implementation in a separate PR.
