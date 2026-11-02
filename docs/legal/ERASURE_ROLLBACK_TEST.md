# Erasure pipeline: rollback test (v2)

Proves the erasure pipeline (`private.purge_user_data`, `private.run_erasure_queue`) works against the **real**
schema, triggers and cascades of project `ydqhzvvoyufiiqvzcjns`, and leaves **nothing** behind.
The pipeline ships dormant: no cron job, and `erasure_worker_enabled` stays false.

## Run it (about two minutes, Supabase SQL editor)

1. Confirm you are on the production project, by **Project ID**, never by name. Open Settings > General: Project ID
   must read `ydqhzvvoyufiiqvzcjns` and the region must be Southeast Asia (Singapore). A project's *name* can hold any
   text: on 2026-11-02 a project **named** `ydqhzvvoyufiiqvzcjns / sydomega` had ID `nvgedlxlkdzvcelimbvq`, region
   us-east-1 and 0 users, in another organisation, and the SQL editor there produced `relation "public.consent_records"
   does not exist` and `WRONG DATABASE`. If the ID differs you are signed in to the wrong Supabase account or
   organisation; sign in to the one that owns `ydqhzvvoyufiiqvzcjns`. v2 refuses to run on a database without the two
   owner accounts, so the wrong project is harmless, only useless.
2. Run `ERASURE_BEFORE_AFTER_CHECK.sql`. Keep the row.
3. Run the whole of `ERASURE_ROLLBACK_TEST.sql` **once**. It ends in a deliberate error. That is correct: the
   error rolls everything back, and its text is the result.
4. Run `ERASURE_BEFORE_AFTER_CHECK.sql` again. The two rows must be identical.

Baseline measured on the live project on 2026-11-02: `auth_users` 9, `profiles` 9, `platform_owners` 2,
`consent_records` 0, `family_nodes` 0, `heritage_records` 0, `member_state` 35, `synthetic_users_left` 0,
`erasure_flag` null, `erasure_cron_jobs` 0.

## Expected result

The error message starts `ERASURE_TEST_RESULT` and contains `"ALL_CHECKS_PASS": true`, with:

| field | expected |
|---|---|
| `purge.rows_deleted` / `tables_touched` | 3 / 3 (family node, heritage record, member state) |
| `owner.error` | `owner_protected` (the owner account cannot be purged) |
| `no_request.error` | `erasure_not_requested` |
| `queue_when_flag_off.enabled` | `false` (the queue does nothing while the flag is off) |
| `log_rows` | 1, holding a hash, never the user id |

## The finding it surfaces

`FINDING_consent_cascade`: `consent_records` is on the purge's retained list, but its row is **gone** after the
purge because it cascades from `profiles`. Deleting the profile destroys the row the retention exception was meant
to keep. Whether consent records must be kept is counsel's call (`LEGAL_GAP_AUDIT.md`). Whichever way it goes, the
schema has to match: either drop the retention claim, or detach the table from the cascade before the worker is
ever enabled.

## Why v1 was replaced

v1 needed `set_config('session_replication_role', ...)`, which the editor role may not do (`42501`). Reading the
live triggers also showed it could not have passed anyway: `handle_new_user()` creates the profile itself, and
`enforce_access_defaults()` forces `is_owner` to false. v2 uses neither trick.

## Why it is safe

The test is one `DO` block, so one statement and one transaction. The closing `RAISE EXCEPTION` aborts it and
Postgres undoes every row. The access-request email queued by profile creation sits in the same transaction
(`net.http_request_queue`), so the pg_net worker never sees it. The result reports how many were queued and
discarded. The test also refuses to run if the flag is already true.

Verified on a local PG16 replica as a non-superuser role: result true, state unchanged afterwards (9 users, 9
profiles), and the wrong-database guard fires when the owner accounts are absent. **Not yet run on the live project** (status 2026-11-02: four attempts through the connector timed out on the
approval prompt, and the dashboard session was on the wrong project, see step 1).

## Gate: this must pass on production before the worker is enabled

Nobody sets `erasure_worker_enabled` to true, or creates the erasure cron job, until this test has been run on the
production project (Project ID `ydqhzvvoyufiiqvzcjns`) with `"ALL_CHECKS_PASS": true` and the before and after check
rows identical. Record the date and result on row 20 of `LEGAL_GAP_AUDIT.md`. The replica run proves the logic; only
the production run proves it against the real triggers and grants.
