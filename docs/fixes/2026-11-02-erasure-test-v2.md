### Erasure rollback test rewritten: no superuser needed, wrong-project guard, cascade finding (2026-11-02)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Symptom.** The owner ran v1 in the SQL editor and got `42501 permission denied to set parameter "session_replication_role"`, and the check query failed with `42P01 relation "cron.job" does not exist`.

**Cause.** v1 needed a superuser-only setting, and it was never run against the real triggers. Reproduced the 42501 on a local PG16 replica as a non-superuser. `handle_new_user()` already creates the profile and `enforce_access_defaults()` forces `is_owner=false`, so v1 would have failed on a duplicate key even with the privilege. The `cron.job` error means the editor was on a different project than `ydqhzvvoyufiiqvzcjns` (pg_cron is installed there).

**Fix.** `docs/legal/ERASURE_ROLLBACK_TEST.sql` v2 inserts synthetic users into `auth.users`, lets the real trigger create profiles, then updates them. It refuses to run if the two owner emails are absent or the erasure flag is already true. `docs/legal/ERASURE_BEFORE_AFTER_CHECK.sql` guards `cron.job` with `to_regclass`.

**Verified.** Local replica as a non-superuser: `ALL_CHECKS_PASS: true`, purge 3 rows in 3 tables, owner refused, no-request refused, flag-off no-op, state unchanged afterwards; guard raised `WRONG DATABASE` with owners deleted inside a rolled-back transaction. The check query ran on the live project: 9 users, 9 profiles, 2 owners, 0 cron jobs. **The test itself has not run on the live project.**

**Finding.** `consent_records` is retained by the purge but cascades from `profiles`, so the row is destroyed anyway (reported by the test as `FINDING_consent_cascade`).
