# Deploying studio-canon

Not deployed yet: it is `LOCAL_ONLY` in `docs/runtime/supabase-edge-functions-live.json`, absent from `supabase/config.toml`,
and `worlds.html` shows UNAVAILABLE until it is live. Merging does not deploy it, because a function missing from `config.toml`
never deploys. To turn it on, in one change:

1. Add to `supabase/config.toml`: `[functions.studio-canon]` and `verify_jwt = true`.
2. Add `studio-canon` to `config/omega-edge-function-auth.json` (`verify_jwt: true`, `auth_mode: SUPABASE_JWT`).
3. After the live deploy, record it in `docs/runtime/supabase-edge-functions-live.json` as DEPLOYED with the live version,
   `live_sha256` and `repository_blob_sha` (read from the provider, not typed).
4. Call it once as an approved member (expect the canon) and once as an unapproved account (expect 403).
5. Regenerate the payload after any canon edit: `python3 scripts/studio-worlds-check.py --write-function-data`.
