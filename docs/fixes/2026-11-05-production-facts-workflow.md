### Manual read-only workflow runs the production facts query (2026-11-05)

**Why.** The only way to read production facts was to paste a query into the right Supabase project's SQL editor by hand, and one run already landed in the wrong project. The Supabase connector in an agent session reaches only a lookalike project, so production evidence kept stalling on a manual step. Production already has a controlled path: `supabase-controlled-migration-push.yml` runs in the `supabase-production` environment with `SUPABASE_ACCESS_TOKEN`, linking `ydqhzvvoyufiiqvzcjns` by reference.

**Fix.** `.github/workflows/supabase-production-facts.yml`: `workflow_dispatch` only, main only, `contents: read`, same environment and token. It refuses to run unless `docs/runtime/production-facts.sql` is exactly one `WITH ... SELECT` with no write keyword (string literals ignored), calls the read-only Management API endpoint first, and fails when the file's own `verdict` is not `OK`. The JSON goes to the job log and step summary. Actions are SHA-pinned.

**Verified.** The guard was exercised offline: it accepts the real file and refuses a `WITH ... DELETE`, a second statement, and an `INSERT` after a string literal. The embedded Python compiles and the YAML parses. `workflow-contract.py` passes.

**Not done / not verified.** The workflow has not run. Whether `/database/query/read-only` exists on the Management API is not confirmed; on a 404 it falls back to the standard query endpoint, which the guard makes safe for this file. It applies nothing and changes no database. The output is schema names, flag values and row counts for ten tables, in a public repository's log: no row contents and no secrets, but not private.
