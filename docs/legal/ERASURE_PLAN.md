# Status: AWAITING-HUMAN-REVIEW

# Plan: make account erasure real (`delete_account` + the erasure pipeline)

High-risk class (schema, destructive deletes, member data), so this plan comes before any migration
(CLAUDE.md §10). Review record: `docs/legal/ERASURE_CODEX_REVIEW.md`. **No schema, function or
production change is made by this document.**

## Goal

When a member asks to be erased, or deletes their account, their personal data is actually removed
within the 30 days the privacy page promises, except what the owner (on counsel's advice) has
decided to retain, and the platform can prove a purge ran without keeping anything that identifies
the member. Today it does not (`LEGAL_GAP_AUDIT.md` findings 1, 2, 19, 20).

## What exists

- `private.request_account_erasure()` (live): soft-deletes only; no job finishes it (`cron.job` holds one unrelated job).
- `private.delete_account()` (live): deletes from six tables plus `profiles` and `auth.users`, and demands an `aal2` (MFA) session. Of 105 tables with a `user_id`, at most one cascades.
- A **prototype** pipeline (`private.purge_user_data`, `private.run_erasure_queue`, `erasure_policy`, `erasure_log`) that exists **only inside** `docs/legal/ERASURE_ROLLBACK_TEST.sql`, created and rolled back inside one transaction. It is not in `supabase/migrations/`, has never run on production, and passed only on a local replica.

From `supabase/live-schema.json` (snapshot 2026-10-06, 288 tables, so possibly stale): the prototype's
sweep (`user_id`, `profile_id`, `member_id`) reaches **132** tables; **31** more tables carry
`owner_id`/`author_id`/`actor_id`/`created_by`/`sender_id`/`recipient_id`/`granted_by`, **29** of them
not swept at all.

## Findings from reviewing the prototype

| # | Finding | Class | Confidence |
|---|---|---|---|
| 1 | **Delete is the default.** Every swept table is deleted unless listed in `erasure_policy`, and only `consent_records` and `sovereign_events` are listed. The sweep therefore deletes `payments`, `billing_invoices`, `subscriptions`, `omega_service_orders`, `commission_contracts` and security tables such as `threat_events`. Financial and fraud records usually have a legal retention period. | missing edge case / legal | certain (the code), COUNSEL (the periods) |
| 2 | **Partial erasure is committed.** If the final `delete from auth.users` fails, the function returns `{ok:false}` normally, so the earlier deletes are **not** rolled back. The member is half-erased and still marked as requested. | missing edge case | certain |
| 3 | **The log claims success before the work is done.** `erasure_log` is inserted before the `auth.users` delete, so a failed purge still leaves a "purged" row. | silent failure | certain |
| 4 | **One bad member blocks the queue.** `run_erasure_queue()` calls the purge with no per-member exception handler, oldest first, 25 at a time. Any error other than a foreign-key violation aborts the whole run, and the same member is first in line next time. | race / edge case | certain |
| 5 | **Rows that reference the member without being theirs are left.** `owner_id`/`author_id`/`created_by`-style columns are counted and left. A foreign key then fails the `auth.users` delete (finding 2); with none, the UUID survives in 29 tables. | edge case | likely (needs the live FK list) |
| 6 | **Storage files are not touched.** Avatars and any `kyc_doc_path` document live in Storage, not in a table. | edge case | certain (not in the code); impact 0 today (0 ID documents) |
| 7 | **No explicit `REVOKE EXECUTE ... FROM PUBLIC`** on the new `SECURITY DEFINER` functions (CLAUDE.md §8.1 class 6a). The `private` schema's lack of `USAGE` for members probably protects them today; that is an assumption, not a grant. | unguarded RPC | likely |
| 8 | **Retention exception defeated by the schema.** `consent_records` cascades from `profiles`, so retaining it is impossible as built (`LEGAL_GAP_AUDIT.md` #19). | schema | likely (replica result) |
| 9 | **A new table is silently deleted-by-default or silently kept.** Nothing forces a person to classify a table added next month. | missing edge case | certain |
| 10 | **External processors are untouched:** the Stripe customer, Resend, Anthropic-held content, provider backups. | out of scope here, must be stated | certain |

## Approach (phased; nothing destructive ships live without the gate)

**Phase 1: inert pipeline in `supabase/migrations/`.** Promote the prototype to a real migration,
fixed for findings 2 to 9, shipped dormant (`erasure_worker_enabled=false`, no cron job, not callable
by members).
- **Fail closed, not delete-by-default.** *(Classification and its CI check exist as of 2026-11-03: `config/erasure-policy.json`, `scripts/erasure-policy-contract.py`; 161 tables, 39 pending a decision, none yet reviewed.)* `private.erasure_policy` classifies **every** table that carries a member column as `delete`, `anonymise` or `retain`. The purge **refuses to run** while any such table is unclassified. A CI contract script asserts the same against the migrations, so a new table cannot merge unclassified. (Finding 9, 1.)
- **All-or-nothing per member.** The purge runs each member inside its own sub-transaction and returns `ok:false` with *everything rolled back* if any step fails; the log row is written only after success; a failed member is marked and skipped, not retried first forever. (2, 3, 4.)
- **`anonymise` for rows that must stay but should not identify:** detach `user_id` (or replace with a one-way hash) and null the free-text personal columns. This is how financial records can be kept without keeping the person. (1, 5.)
- **Explicit `REVOKE ALL ... FROM PUBLIC, anon, authenticated`** on every new function, with a grant test. (7.)
- Storage objects are deleted in a separate, logged step through the Storage API from an Edge Function, not from SQL. (6.)

**Phase 2: `delete_account()`.** Stop deleting instantly. Make it record the erasure request, sign the
member out, and let Phase 1 finish after a cooling-off period with a cancel link. Drop the `aal2`
requirement only if cooling-off and a notification email replace it (an instant, irreversible delete
behind a stolen session is the worse trade). **Needs the owner's decision (D3).**

**Phase 3: schedule and enable.** Only after the gate below.

## Decisions I need (they are not mine to make)

- **D1, financial records** (`payments`, `billing_invoices`, `subscriptions`, `omega_service_orders`, `commission_contracts`): retain anonymised for how many years? *Counsel.* Recommendation: `anonymise`, never `delete`.
- **D2, consent and event records:** keep a minimal evidence record (consent type, time, hash of the member) after erasure, or delete fully? *Counsel.* Recommendation: minimal evidence record, detached from the cascade.
- **D3, `delete_account`:** cooling-off with cancel (recommended) and the MFA requirement dropped, or keep instant delete behind `aal2`.
- **D4, timing:** the prototype waits 14 days and runs weekly; the privacy page says "within 30 days". Recommendation: 14-day cooling-off, daily job, so the longest case is about 15 days.

## Out of scope

External processors (Stripe, Resend, Anthropic), provider backups, and the privacy-page wording
(`LEGAL_GAP_AUDIT.md`). Each must be named in the notice; none is fixed by SQL.

## Gate and success criteria

1. A new test suite plus the existing `ERASURE_ROLLBACK_TEST.sql` pass on a **local replica built from the migrations** (CI's "Fresh database replay" already builds one).
2. They pass on the **staging project** once it exists and has the schema (`docs/STAGING_ENVIRONMENT.md`). Staging is a different project from production and has 0 users, so the test must create its own synthetic members.
3. They pass on production `ydqhzvvoyufiiqvzcjns` with before/after rows identical (the existing gate, `LEGAL_GAP_AUDIT.md` row 20).
4. Only then: `erasure_worker_enabled=true` and the cron job, by the owner.

Success = for a synthetic member with rows in every classified table, after a purge: `delete` tables have 0 rows, `anonymise` tables have rows with no member id and no free-text personal columns, `retain` tables are as classified, `auth.users` and `profiles` are gone, a log row holds a hash only, and an injected failure leaves the member **fully intact** and unlogged.

## Note on the staging project

The project the owner first named as staging (`nvgedlxlkdzvcelimbvq`) is the lookalike named
`ydqhzvvoyufiiqvzcjns / sydomega` recorded in `ERASURE_ROLLBACK_TEST.md`. Inspected read-only on
2026-11-03 it is **not clean**: 83 recorded migrations, 24 of them with no file in the repo, 354 repo
migrations never applied, and its name contains the production ID. Use a **new empty project**
(`docs/STAGING_ENVIRONMENT.md`) for the gate in step 2 above, and always confirm by Project ID.
