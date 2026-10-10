# Ω SYD OMEGA 91717 — Edge Runtime Parity Control

## Provider snapshot

Authenticated Supabase inspection on **2026-10-10** reported **16 ACTIVE Edge Functions** for project `ydqhzvvoyufiiqvzcjns`:

`concierge`, `concierge-orchestrator`, `growth-orchestrator`, `product-orchestrator`, `stripe-webhook`, `secrets-health`, `agent-execute`, `evidence-graph`, `omega-notification-worker`, `omega-runtime-gateway`, `omega-media-worker`, `intel-feed`, `omega-provider-worker`, `omega-knowledge-embedding-worker`, `content-ingest`, `content-delivery`.

All 16 have identifiable repository source paths in the current source tree/search evidence.

## Why this is still a release-control item

The repository contains additional Edge Function source beyond this active provider set. Therefore **repository presence is not deployment evidence** and an ACTIVE provider inventory is not proof that every repository function is deployed.

The canonical parity decision for each function is one of:

- `ACTIVE_AND_PARITY_VERIFIED`
- `ACTIVE_PROVIDER_SOURCE_DRIFT`
- `REPOSITORY_ONLY_DORMANT`
- `PROVIDER_ONLY_UNRECOVERED_SOURCE`
- `RETIRED_AND_DOCUMENTED`
- `BLOCKED`
- `UNVERIFIED`

A function cannot be silently classified as active merely because its directory exists.

## Required reconciliation

For every production-intended function:

1. Match the provider slug to exactly one canonical repository source path.
2. Compare the deployed version/source fingerprint to the reviewed source revision where the provider exposes sufficient evidence.
3. Verify JWT posture against the capability/authorization contract.
4. Verify required environment/secrets by presence/fingerprint only; never store secret values.
5. Exercise representative authorized, unauthorized, malformed, and repeated requests where the function has consequential behavior.
6. Record the result as evidence and link it to the page/capability/task contract.
7. If a repository function is not intended for production, explicitly mark it dormant/retired instead of leaving an ambiguous state.

## Current provider finding

The Supabase Security Advisor currently reports one warning: **leaked password protection is disabled**. This is a provider configuration/plan control and cannot honestly be closed by a repository-only commit.

## Truth boundary

This document is a dated evidence snapshot. It must be refreshed by an authenticated provider query before release decisions. It is not a substitute for live state.

