# Staging environment (Supabase)

A separate Supabase project for testing migrations and Edge Functions before they reach
production. Merging to `main` deploys to production (CLAUDE.md §8.2), so staging is the only place a
migration can run against a real Postgres first without risking member data.

**Status: workflow written, never run.** `.github/workflows/supabase-staging-deploy.yml` was
checked by `workflow-contract.py` and `workflow-contract-lint.py` and its refusal logic was tested
locally, but it has not executed on a runner: no staging credentials existed when it was written.
Treat the first run as the test.

## One-time setup (owner steps, in GitHub)

**Do not point this workflow at `nvgedlxlkdzvcelimbvq` as it stands.** It was inspected read-only on
2026-11-03 (schema metadata and counts only, no member data) and is not a clean project:

| fact | value |
|---|---|
| name / organisation | `ydqhzvvoyufiiqvzcjns / sydomega`, a Vercel-integration organisation (`vercel_icfg_...`), us-east-1 |
| public tables / auth users | 89 / 0 |
| recorded migrations | 83, latest `20261012150000` (the repo's latest is `20261025100000`) |
| versions recorded there with **no** file in the repo | **24** (for example `20260817225138`, `20261001221116`) |
| repo migrations never applied there | **354** of 413 |
| `pg_cron` | not installed (available, not enabled) |

So `supabase db push` would stop on a history mismatch (a remote version with no local file). That is the
safe outcome, but the workflow cannot succeed here. **Do not repair the history** by marking versions
reverted or rewriting them (`supabase/migrations/README.md`, "Safe recovery procedure"). The name also
contains the production project ID, which already misled one dashboard session
(`docs/legal/ERASURE_ROLLBACK_TEST.md`).

**Recommendation: create a new, empty Supabase project named `sydomega-staging`** in the organisation you
control, and use that. Then the first run applies all 413 migrations to a clean database. Resetting the
lookalike instead would need a destructive `DROP`, which is the owner's call, and would leave a staging
project owned by a Vercel integration.

Then, for the new project:

1. Repo **Settings > Environments > New environment**: `supabase-staging`. Optionally add yourself as
   a required reviewer so every run waits for approval.
2. In that environment, add a **variable** `STAGING_PROJECT_REF` = the new project's 20-character ref.
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

## History check

`scripts/migration-history-contract.py --remote-output` compares `supabase migration list` with the
local files. It used to count a blank Remote column as applied remotely, so it could never report a
migration missing remotely; fixed 2026-11-03 (`docs/fixes/2026-11-03-migration-history-remote-column.md`).
The staging workflow still runs its own row-by-row Local/Remote comparison as well, deliberately.
