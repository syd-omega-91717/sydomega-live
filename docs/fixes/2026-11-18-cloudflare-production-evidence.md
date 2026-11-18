# Cloudflare production evidence gate alignment

- Date: 2026-11-18
- Change: Re-keyed the production evidence domain from the retired Vercel-specific label to `cloudflare_production`, matching the repository's declared production host.
- Safety: The domain remains `BLOCKED` until the Cloudflare production workflow proves the exact main SHA, both canonical aliases, CSP/HSTS, core route/full-estate smoke tests and rollback readiness.
- UI: Observatory now labels this as Cloudflare Pages production and does not present repository declarations as live telemetry.
- Tests: Updated the evidence-gate and Observatory regression contracts to enforce the new provider-specific requirements.
- No provider configuration, deployment secret, database schema, migration, or production traffic was changed.
