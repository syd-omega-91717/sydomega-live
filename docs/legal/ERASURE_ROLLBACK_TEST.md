# Erasure pipeline: how to run the rollback test

**Why this exists.** `LEGAL_GAP_AUDIT.md` findings 1 to 3: the privacy page promises permanent deletion within 30
days, but `request_account_erasure()` only soft-deletes, `delete_account()` wipes six tables, and nothing is
scheduled. The pipeline in `ERASURE_ROLLBACK_TEST.sql` fixes that and ships **dormant** (flag off, no cron).
It has not been proven against the live database. Running it through the Supabase connector timed out four times on
the connector's confirmation prompt, so it is run here, by you, in the SQL editor, where there is no 60 second limit.

**What the test does.** One script. It creates the dormant pipeline objects, builds two *synthetic* accounts (an
ordinary member and an owner, on `@invalid.test` addresses), runs the purge on them, then ends with a deliberate
error so the database undoes everything. The error text is the result. It never touches a real member or your real
owner accounts, and it does not schedule the cron job.

**Rollback: the script is one statement.** The whole test is a single `DO` block, so Postgres applies it all or
not at all, however the SQL editor submits it. The final error undoes every object, row and account it created.
Still check afterwards (step 3): a check is cheaper than an assumption.

**Dry run, 2026-11-02, on a throwaway local Postgres 16 with a stand-in schema (not your database).** The error
text matched every expected value in the table below, and the database was identical before and after. A parent
table that sorts before its child (blocked on the first pass) was purged on the retry pass. A first version of this
script was several statements and, run statement by statement, left its `create` objects behind; that is why it is
now one statement. What the dry run cannot prove: live constraints, live triggers and the real 100+ tables.

**Two live differences to expect.** (1) The script sets `session_replication_role = replica` so the test inserts
fire no profile triggers or emails. If the SQL editor role may not set it, the script stops at once with a
"permission denied" error before changing anything; send me the text. (2) Sequences are not transactional, so
`heritage_records` and `consent_records` ids may skip one number. Nothing else survives.

## Steps

1. **Before.** In the Supabase SQL editor run the read-only check below. Write the numbers down.
2. **Run.** Paste all of `ERASURE_ROLLBACK_TEST.sql` and run it **once**. It will show a red error that begins
   `ERASURE_TEST_RESULT {...}`. That is the success path, not a failure. Copy the whole message.
3. **After.** Run the same read-only check again. Every number must equal step 1.
4. Send me the error text from step 2 and both sets of numbers.

### The read-only check (run it before and after)

```sql
select
  (select count(*) from information_schema.tables where table_schema = 'private' and table_name in ('erasure_policy', 'erasure_log')) as erasure_tables,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname in ('purge_user_data', 'run_erasure_queue')) as erasure_functions,
  (select count(*) from cron.job where jobname = 'omega-erasure-worker') as erasure_cron,
  (select count(*) from public.platform_settings where key in ('erasure_worker_enabled', 'erasure_delay_days')) as erasure_flags,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles;
```

On 2026-11-02, before any attempt that ran, this returned `0, 0, 0, 0, 9, 9`.

## What a passing result looks like

The error message holds JSON with these values:

| field | expected | what it proves |
|---|---|---|
| `queue_when_flag_off` | `{"enabled": false}` | the scheduled entry point does nothing while the flag is off |
| `owner` | `{"ok": false, "error": "owner_protected"}` | the purge refuses to delete an owner |
| `no_request` | `{"ok": false, "error": "erasure_not_requested"}` | the purge refuses a member who never asked |
| `purge.ok` | `true` | the purge ran to the end |
| `purge.blocked` | `[]` | no table was left blocked by a foreign key |
| `purge.retained` | `["consent_records", "sovereign_events"]` | the two retention exceptions were skipped, not deleted |
| `after.family`, `after.heritage`, `after.member_state` | `0`, `0`, `0` | the member's own rows are gone |
| `after.consent_retained` | `1` | the retained table kept its row (counsel decides this later) |
| `after.auth_users`, `after.profiles` | `0`, `0` | the account and profile are gone |
| `after.owner_profile_intact` | `1` | the synthetic owner survived |
| `log_rows` | `1` | exactly one purge was logged |
| `log_has_uid` | `0` | the log holds a hash, never the member's id |

## If something differs

- **A `blocked` table appears:** a foreign key stops the purge. Send me the table name; I fix the order.
- **`owner` or `no_request` differ:** a guard is wrong. Do not ship the pipeline. Send me the output.
- **Step 3 numbers differ from step 1:** the rollback did not undo something. Send me both sets of numbers
  straight away. The objects the script creates are dormant (flag off, no cron, `private` schema), so nothing
  runs, but I will give you the exact `drop` statements to remove them. **Dropping needs your confirmation; I do
  not run drops.**

## What happens after it passes

1. I put the pipeline into a new timestamped migration (dormant: flag `false`) and add the cron job, in a PR you
   review. Merging a migration deploys it to production, so it is a decision, not a side effect.
2. Still your decision, not code: how long to keep consent records and the event log after erasure, whether
   storage files are removed by the Storage API (SQL cannot delete the files), and the columns that point at a
   member without being theirs (`owner_id`, `author_id`, `actor_id`, `created_by`, `sender_id`). These need counsel.
3. Only then does `erasure_worker_enabled` get turned on, by you.
