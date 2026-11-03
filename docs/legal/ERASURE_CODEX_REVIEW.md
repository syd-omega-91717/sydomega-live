# Review record: erasure plan

**Reviewer:** none external. The repo's Codex reviewer fails on every run (usage limit, `GAP_ANALYSIS.md`
§S, "POSTPONED 2026-10-18"), so there is **no adversarial second reading** of
`docs/legal/ERASURE_PLAN.md`. The review below is the same model that wrote the plan, checking the
prototype against the repo's eight bug classes plus the schema extension. It is weaker than a second
reviewer and should be treated as such.

**Verdict: AWAITING-HUMAN-REVIEW.** Not APPROVED-BY-CODEX, because no Codex review took place.

## Round 1: prototype (`docs/legal/ERASURE_ROLLBACK_TEST.sql`) against the threat model

| Class | Result |
|---|---|
| 1 stored XSS | not applicable (no rendering) |
| 2 silent-failure writes | **finding 3** (log written before the work succeeds), **finding 2** (failure returns normally, commits partial work) |
| 3 RLS gaps | `erasure_policy` and `erasure_log` enable RLS and revoke from `public, anon, authenticated`; no policies, so closed. Fine. |
| 4 column-name mismatches | sweep is by catalogue, not hand-written names. Risk is **finding 5** (columns it does not sweep) |
| 5 module boundaries | not applicable |
| 6 unguarded RPCs | **finding 7**, missing explicit `REVOKE ... FROM PUBLIC` on `SECURITY DEFINER` functions; `owner_protected` and `erasure_not_requested` guards are present and correct |
| 7 races | **finding 4** (queue head-of-line blocking); a member active during the purge can insert a row after the delete pass and break the `auth.users` delete |
| 8 missing edge cases | **findings 1, 6, 9** |
| schema extension (cascades, ordering) | **finding 8** (cascade defeats retention); the three-pass retry for foreign keys is a workaround for ordering, not a guarantee |

## What was checked and what was not

Checked: the prototype's source, the audit's evidence, and table counts and column names from
`supabase/live-schema.json` (snapshot 2026-10-06; may be stale).

**Not checked:** the live foreign-key list (so finding 5 is "likely"), live row counts in the
financial tables, the live `private.delete_account` source beyond what the audit quotes, and any
behaviour on a running database. No SQL was executed for this review.

## Open
D1 to D4 in the plan. No implementation starts until D1 and D2 have an answer from counsel, because the
policy table's contents depend on them.
