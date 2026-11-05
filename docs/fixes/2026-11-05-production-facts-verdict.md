### production-facts.sql states whether it ran on production (2026-11-05)

**Why.** The query was run in the wrong Supabase project and its output looked plausible: 83 recorded migrations, latest `20261012150000`, 0 of 2 owner accounts, no `payments`/`subscriptions`/`billing_invoices`, no `pg_cron`. The repo's drift gate records 413 live production versions. Nothing in the output said so, and the only safeguard was a comment asking the reader to check the project ID.

**Fix.** The query now returns a `verdict` field: `STOP` when no owner account exists or fewer than 300 migrations are recorded, otherwise `OK` (with a reminder to confirm the dashboard URL). The header tells the reader to read it first.

**Verified.** The `verdict` expression was executed read-only against the non-production project the connector reaches (`nvgedlxlkdzvcelimbvq`) and returned `STOP` with `owner_accounts_present: 0`. The full edited file was not re-run end to end; the rest of the query is unchanged from the version tested on the replica.

**Not done / not verified.** The `OK` branch has not been seen on production. The thresholds (0 owners, 300 migrations) are a heuristic, not proof of identity: `OK` still requires the dashboard URL check.
