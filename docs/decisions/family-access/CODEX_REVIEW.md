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

## Round 2 — VERDICT: REVISE (2026-10-12)

The reviewer confirmed every round-1 finding is addressed and raised these:

| # | sev | finding | resolution adopted |
|---|---|---|---|
| 1 | major | `get_all_members` returns no `family_of`, so approvals cannot show or undo a link; `revoke_family_link` has no caller | add `'family_of', p.family_of` to the live body (no filter — the owner sees family); FAMILY chip + UNLINK action in approvals.js |
| 2 | major | `revoke_member` keeps the link; the "same owner = no-op" rule would skip re-writing access after a revoke | the same-owner path still writes the access fields and skips only the link; `revoke_member` keeps the link, shown by the chip |
| 3 | minor | two owner accounts: owner B refused on owner A's link | a link held by any `is_owner` account counts as the same household; any owner may unlink |
| 4 | minor | guard body: latest repo copy is `20260927143525`; it passes the private function because `auth.uid()` is still the owner | body from live; the diff against live must be exactly the one added `if` |
| 5 | minor | snapshot DELETE relies on function owner / no FORCE RLS | check `proowner` and `relforcerowsecurity` live before relying on it; a concurrent snapshot run is accepted (the next run deletes again) |
| 6 | minor | `access_grant_audit` has `detail text`, no jsonb | dob/birth_date/attestation as a JSON string in `detail`; `allowed=false` rows on refusals |
| 7 | minor | approvals actions run inside `OmegaGuardian.gate('admin', …)`; new strings need T_EN + 6 packs | adopted |
| 8 | note | approvals.js `load()` (line 153) falls back on `catch`, not `r.error` (§8.1 class 1) | logged in GAP_ANALYSIS.md, not fixed in this change |

Status: round 3 (final, per Mode 1's 3-round budget) reviews the implementation diff itself.
