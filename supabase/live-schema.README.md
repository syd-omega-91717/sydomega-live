# `live-schema.json` — the snapshot, and why it is not optional

`supabase/live-schema.json` is a dated capture of the **live** `public` schema:
every table, view, materialized view and partitioned table, mapped to its
columns in `attnum` order.

## Why it exists

`scripts/schema-dictionary.py` gates the second most expensive recurring bug
class in this repo (`CLAUDE.md` §8.1 class 2): **a column name that does not
exist**. PostgREST rejects the *entire* query or write when any single column is
unknown, so one wrong name empties a whole page with no visible error and no
thrown exception.

Until this snapshot existed, that gate could only build its dictionary from
`supabase/*.sql` — from what this repo *intends* the schema to be — plus a
hand-maintained `KNOWN_LIVE_COLUMNS` dict patching the places where live had
already drifted. Two problems with that:

1. **A hand-maintained patch list drifts again the moment live does.** It is the
   same failure mode as a count typed into prose.
2. **The bag and live are provably different.** `public.task_completions` is the
   standing counterexample: live has

   ```
   id, user_id, kind, task, completed_at, axis, increment, created_at,
   task_name, task_type, axis_type, description, points_earned,
   axis_a_before, axis_b_before, axis_c_before,
   axis_a_after,  axis_b_after,  axis_c_after, auth_after
   ```

   which matches none of the three competing `CREATE TABLE IF NOT EXISTS`
   definitions in the SQL bag.

Checking client code against intent rather than reality makes the checker report
columns that genuinely exist — and an advisory checker that cries wolf is one
nobody reads, which is exactly what had happened.

## How it is used

`parse_sql_files()` folds the snapshot in **additively**:

- a column live has → accepted, even if no `CREATE TABLE` declares it;
- a column the bag declares but live lacks → still accepted, because the bag may
  legitimately be ahead of an unapplied migration.

The snapshot's job is to remove **false positives**, not to become a second
source of truth about what *should* exist. The flat `supabase/*.sql` bag remains
the source of truth for new schema changes (`CLAUDE.md` §5).

If the file is missing or unparseable the gate falls back to
`KNOWN_LIVE_COLUMNS` rather than failing, so a bad snapshot cannot take CI down.

## Regenerating

Run this against the production project and rewrite the `tables` object:

```sql
select jsonb_pretty(jsonb_object_agg(t, cols))
from (
  select c.relname as t,
         to_jsonb(array_agg(a.attname order by a.attnum)) as cols
  from pg_class c
  join pg_attribute a
    on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  where c.relnamespace = 'public'::regnamespace
    and c.relkind in ('r','v','m','p')
  group by c.relname
) s;
```

Update `_captured` in the same edit. **Regenerate whenever schema changes are
applied live** — this file is dated evidence, not a target, and a stale snapshot
silently re-opens the false-positive problem it was written to close.

## Verifying the gate still bites

A checker that reports nothing looks identical to a checker that is not running
(`CLAUDE.md` §8.4). Confirm with a negative control before trusting an `OK`:
temporarily add a nonsense column to a real `.select()` call, run
`python3 scripts/schema-dictionary.py`, and check it reports the mismatch with a
`file:line`, then restore the file and confirm it goes back to clean.
