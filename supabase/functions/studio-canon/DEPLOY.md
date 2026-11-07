# Deploying studio-canon

Configured to deploy: it is in `supabase/config.toml` (`verify_jwt = true`), in `config/omega-edge-function-auth.json`, and
recorded as `PENDING_DEPLOY` in `docs/runtime/supabase-edge-functions-live.json`. The Supabase GitHub integration redeploys every
function in `config.toml` when the change merges to `main`. `PENDING_DEPLOY` means configured, not yet seen live.

After the merge:

1. Call it once as an owner (expect the canon) and once as an approved non-owner (expect 403 `owner_only`).
2. Record it in the snapshot as `DEPLOYED` with the live version, `live_sha256` and `repository_blob_sha`, read from the provider.
3. After any change to `index.ts`, refresh `repository_blob_sha` (the reconciliation contract fails on drift).
4. After any canon edit: `python3 scripts/studio-worlds-check.py --write-function-data`.

Until step 1 succeeds, `worlds.html` shows UNAVAILABLE (not deployed) or RESTRICTED (not an owner).

## Observed 2026-11-07 (after PR #1196 merged)
An unauthenticated GET to `/functions/v1/studio-canon` returned 401 `UNAUTHORIZED_NO_AUTH_HEADER`, and a control for a function that does not exist
returned 404 `NOT_FOUND`, so the function exists on production and the gateway enforces its JWT requirement. **Not yet verified:** that the deployed
code is this repository's version, that an owner receives the canon, and that an approved non-owner receives 403 `owner_only`. The snapshot therefore
stays `PENDING_DEPLOY` until those are seen (a status of DEPLOYED claims the live code matches `repository_blob_sha`).
