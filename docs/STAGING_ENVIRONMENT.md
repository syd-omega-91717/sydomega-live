# Staging environment (Supabase)

A separate Supabase project for testing migrations and Edge Functions before they reach
production. Merging to `main` deploys to production (CLAUDE.md §8.2), so staging is the only place a
migration can run against a real Postgres first without risking member data.

**Status: workflow written, never run.** `.github/workflows/supabase-staging-deploy.yml` was
checked by `workflow-contract.py` and `workflow-contract-lint.py` and its refusal logic was tested
locally, but it has not executed on a runner: no staging credentials existed when it was written.
Treat the first run as the test.

## One-time setup (owner steps, in GitHub)

Staging project ref: `nvgedlxlkdzvcelimbvq` (supplied by the owner 2026-11-03; not in the Supabase
connector's account, so this session never reached it).

**Rename it first.** `docs/legal/ERASURE_ROLLBACK_TEST.md` records this project as named
`ydqhzvvoyufiiqvzcjns / sydomega`: its *name* contains the production project ID, which already led one
dashboard session to the wrong project. Rename it (for example `sydomega-staging`) before anyone runs
destructive tests there, and always confirm by **Project ID** (Settings > General), never by name.

1. Repo **Settings > Environments > New environment**: `supabase-staging`. Optionally add yourself as
   a required reviewer so every run waits for approval.
2. In that environment, add a **variable** `STAGING_PROJECT_REF` = `nvgedlxlkdzvcelimbvq`.
3. In that environment, add **secrets** (never in the repo, chat or a `.env` file):
   - `STAGING_SUPABASE_ACCESS_TOKEN`: a personal access token created by the Supabase account that
     owns the staging project (Supabase dashboard > Account > Access Tokens).
   - `STAGING_SUPABASE_DB_PASSWORD`: the staging database password (Project Settings > Database).
4. **Actions > Supabase Staging Deploy > Run workflow**, tick the confirmation. Leave
   `deploy_functions` off for the first run.

The `sb_secret_...` key from the dashboard quickstart is **not** used by this workflow and does not
need to be stored in GitHub.

## What the workflow guarantees

- Refuses unless `STAGING_PROJECT_REF` is a 20-character ref that is not production
  (`ydqhzvvoyufiiqvzcjns`), and re-checks the ref the CLI actually linked.
- Uses `STAGING_*` secrets only, so a production token cannot be used by mistake.
- Dry-runs, applies with `db push` (never `--include-seed`), then requires every remote version to
  match a local file and the counts to be equal.
- Optional second step deploys the functions in `supabase/config.toml` (`--use-api`, so no Docker).

## What it does NOT do

- **No frontend uses staging.** Every page and function call is hardcoded to production
  (`ydqhzvvoyufiiqvzcjns.supabase.co`), including Cloudflare Pages branch previews. Staging is
  reachable only by running SQL or calling its functions directly. Pointing a preview build at it is a
  separate change and is not made here.
- **No data is copied.** The database is schema only. Never load production member data into staging.
- **Edge Function secrets are not set.** `ANTHROPIC_API_KEY`, `STRIPE_*`, `RESEND_API_KEY`,
  `TWELVE_DATA_API_KEY` must be set on staging with `supabase secrets set`, using **test-mode or
  throwaway keys only**, never the production ones.
- **Auth settings are not migrated:** site URL, redirect URLs, providers, SMTP, rate limits.
- **Feature flags:** confirm `platform_settings` flags such as `tokens_enabled` are `false` after the
  first run.
- Storage buckets, extensions and `pg_cron` jobs are applied only to the extent the migrations
  create them. Compare with `supabase/live-schema.json` after the first run.

## Known gap found while writing this

`scripts/migration-history-contract.py` line 82 (`remote.add(match.group(2) or match.group(1))`)
counts a migration with a blank Remote column as applied remotely, so on `supabase migration list`
output it can never report a version that is missing remotely. The staging workflow does not rely on
it: its own check compares the Local and Remote columns row by row.
