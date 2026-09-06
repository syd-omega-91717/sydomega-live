# SYD OMEGA 91717 — Production State

## Current verified state

- GitHub `main` contains the deterministic Vercel static-public build contract.
- The Vercel builder emits `public/` and asserts `public/index.html` before completion.
- Supabase project `ydqhzvvoyufiiqvzcjns` is active and healthy.
- Live migration history includes `20260905080109`, the foreign-key advisor remediation migration.
- The repository carries the same migration under `supabase/migrations/20260905080109_omega_advisor_foreign_key_indexes_20260905.sql`.
- The repository carries a same-day remote migration snapshot under `supabase/remote-migrations.json`.

## Verification rule

Production is not marked fully released until a fresh GitHub run on the current `main` commit passes the contract suite and live-production smoke test, and Vercel accepts a deployment that serves the canonical site. A historical failed run must not be treated as evidence against a later commit when the failing commit predates the corrective changes.

## Known external gate

The Vercel provider/account has recently returned a deployment-rate-limit failure. Repository configuration is therefore hardened, but live Vercel acceptance remains an external gate until a deployment is accepted and the production smoke test receives a 2xx response.
