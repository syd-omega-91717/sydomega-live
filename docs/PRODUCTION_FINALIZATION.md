# Ω SYD OMEGA 91717 — Production Finalization Contract

## Canonical production topology

- GitHub repository: `syd-omega-91717/sydomega-live`
- Production branch: `main`
- Supabase production project: `ydqhzvvoyufiiqvzcjns`
- Supabase URL: `https://ydqhzvvoyufiiqvzcjns.supabase.co`
- Production domains: `sydomega.com`, `www.sydomega.com`
- Vercel output: `public/`
- Vercel build: `bash scripts/vercel-build.sh`

## Non-negotiable Vercel binding

The existing Vercel project must deploy this repository:

`github.com/syd-omega-91717/sydomega-live`

Do not create a replacement project. Do not bind production back to `OMEGA_91717`.

The Vercel project must use the canonical Supabase project above. The legacy integration/project `supabase-cinereous-planet` is not the production backend for this repository.

## Required Vercel production environment

Production and Preview values must point to the canonical Supabase project. Public client configuration may contain only publishable/anon credentials. Service-role and secret credentials must remain server-side and must never be committed or exposed to browser code.

## Deployment verification

A deployment is considered **PRODUCTION VERIFIED** only after all of these succeed:

1. Vercel deployment is `READY` for a commit on `main`.
2. `https://sydomega.com/` returns a successful response.
3. `https://www.sydomega.com/` returns a successful response.
4. `/healthz.html` is reachable from both production hostnames.
5. Static assets referenced by the front door load successfully.
6. Browser Supabase configuration resolves to project `ydqhzvvoyufiiqvzcjns`.
7. Auth/session operations work against the canonical Supabase project.
8. At least one authenticated read and one authenticated write are verified against production with RLS enforced.
9. Production Smoke workflow passes.

Until all nine are evidenced, the state must remain **UNVERIFIED** or **RUNTIME VERIFIED**, never "production ready".

## Current known external gate

The repository and Supabase project are independently accessible and verifiable. Vercel account/project mutation is external to this repository and must be verified in the Vercel project itself. This file intentionally does not pretend that a repository commit can change the Vercel dashboard's Git repository binding or Supabase integration.

## Supabase security gate

The current Supabase security advisor reports leaked-password protection disabled. Enable Supabase Auth leaked-password protection in the production project before declaring the security gate complete.

The performance advisor currently reports unused indexes. Do not mass-delete them. Review them against actual query plans and workload before any destructive index change.
