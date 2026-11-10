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
- A **dormant** pipeline (`private.purge_user_data`, `private.run_erasure_queue`, `private.erasure_policy`, `private.erasure_log`) implemented in `supabase/migrations/20261103230000_erasure_pipeline_dormant.sql` and recorded as applied by the production migration ledger on 2026-11-10. Read-only production checks confirm the objects exist, but `private.erasure_policy` has 0 rows, the worker flag is false, no erasure cron job exists, and the functions are not executable by anon/authenticated/service_role. The local synthetic-schema test validates code paths; it does not prove end-to-end production erasure.

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

**Phase 1: inert pipeline in `supabase/migrations/` (engine written 2026-11-03; provider ledger confirms applied 2026-11-10; policy review and activation remain pending; tested by `scripts/tests/erasure_pipeline_test.sql`).** The migration is now present in production but remains dormant. Keep the policy fail-closed and complete the remaining review before any worker is enabled. The original implementation goal was to promote the prototype to a real migration,
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

## Decisions (2026-11-03: the owner accepted the recommendations)

| | Decision | Where it is applied |
|---|---|---|
| **D1** | Financial records (`payments`, `billing_invoices`, `subscriptions`, `omega_service_orders`, `commission_contracts`, `sovereign_points_ledger`): **anonymise, never delete**. | `config/erasure-policy.json` (action `anonymise`, still `reviewed: false`) |
| **D2** | Consent and event records (`consent_records`, `sovereign_events`, `platform_events`, `threat_events`): **keep a minimal record, never the member id** (consent: type, time, hash). | same |
| **D3** | `delete_account()` becomes a **cancellable cooling-off request** and the MFA requirement is dropped, replacing instant delete. | **Not built.** Phase 2: it changes a live member-facing function. |
| **D4** | **14-day** cooling-off, **daily** job. | `erasure_delay_days = 14` is seeded; the **daily job is not created** (phase 3). |

The owner is not counsel. The retention *period* for anonymised financial rows, and whether a hashed
consent record satisfies the privacy page's "10 years as proof", remain **counsel's** to confirm before
the worker is enabled. Neither decision enables anything: the engine is dormant and fail-closed.

**Why `anonymise` is not finished.** Anonymising a row means making `user_id` nullable and changing its
foreign key (for example `ON DELETE SET NULL`), plus writing the SET clause for each table's personal
columns. That is DDL on payment tables, and it needs the **live** column list and constraint names, which
this session could not read (production unreachable). Until each table has an `anonymise_set` and the
schema change, the engine refuses to purge any member who has rows there. That is deliberate.

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

## Provider verification update — 2026-11-10

The production migration ledger records both the dormant erasure engine migration (`20261103230000`) and the D1 financial-retention migration (`20261104090000`) as applied. Read-only production checks confirm the erasure objects exist, but `private.erasure_policy` currently contains **0 rows**; `erasure_worker_enabled=false`; `erasure_delay_days=14`; `pg_cron` is installed but no erasure job is scheduled; and both erasure functions remain non-executable by anon, authenticated, and service_role. The three D1 financial user foreign keys are confirmed `ON DELETE SET NULL` with nullable `user_id`.

**Decision:** keep the erasure worker dormant. Provider application of the migration and D1 schema verification do not complete the policy classification, retention decisions, legal review, member-data inventory, or end-to-end account deletion proof. Do not enable the worker or schedule a job until those controls are complete and reviewed.
