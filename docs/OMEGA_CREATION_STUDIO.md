# Ω Creation Studio

The Creation Studio is the browser-facing control surface for the governed Creation Layer.

## Canonical path

IDEA → PROJECT → DESIGNED ASSET → PROVIDER JOB → VERIFIED ARTIFACT → READY/LIVE

The UI deliberately does **not** write the four governed Creation Layer tables directly.

### Client mutations

The page uses authenticated RPCs:

- `omega_create_creative_project`
- `omega_create_creative_asset`
- `omega_submit_provider_job`

The browser can read only rows allowed by RLS.

### Truth behavior

- New projects are forced to `DRAFT / USER-CREATED`.
- New assets are forced to `DESIGNED / USER-CREATED`.
- A provider job is submitted only when a provider is actually registered as `READY`.
- `UNCONFIGURED` providers produce an explicit unavailable state; the UI never fabricates provider success.
- `READY / LIVE` counts only assets whose database state says both `status=READY` and `truth_state=LIVE`.

## Current measured production state

As of 2026-10-06, the provider registry contains 12 installed connector adapters and all are `UNCONFIGURED`. Therefore this surface is production-real as a control plane, but provider generation remains unavailable until at least one adapter is authenticated/configured.

The Studio does not claim an end-to-end provider artifact until the provider worker records provider identity, source URI, SHA-256 content hash, provenance and a verified terminal job state.
