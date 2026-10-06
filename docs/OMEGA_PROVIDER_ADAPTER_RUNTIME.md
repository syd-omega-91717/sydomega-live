# Ω Provider Adapter Runtime

## Pipeline

USER → authenticated RPC → provider job → worker lease → provider adapter → verified artifact → creative asset → event/evidence

## Queue

`omega_provider_jobs` is durable and server-owned.

Lifecycle:

`QUEUED → RUNNING → SUCCEEDED / FAILED / CANCELLED`

A provider that is not configured returns `BLOCKED_PROVIDER` to the worker and the job is returned to `QUEUED` with a retry time. No fake success is recorded.

Jobs have:

- attempt count
- maximum attempts
- next-attempt time
- lease expiration
- worker identity
- provider job ID
- provider response
- error code/detail
- timestamps

Concurrent workers use row locking with `FOR UPDATE SKIP LOCKED`.

### Lease recovery

A worker receives a five-minute lease. If it disappears before completing a job:

- the next worker claim pass requeues an expired lease when attempts remain;
- the next claim pass marks an expired lease `FAILED / worker_lease_exhausted` when the maximum attempts are exhausted;
- the recovery path emits a canonical `omega_platform_events` failure event.

### Retry semantics

Provider failures with attempts remaining return to `QUEUED` with a five-minute retry delay. `BLOCKED_PROVIDER` returns to `QUEUED` with a fifteen-minute retry delay.

A terminal failure remains `FAILED` only after the attempt budget is exhausted.

### Stale-worker protection

Completion is bound to the exact worker lease that claimed the job. A stale worker cannot complete or promote an asset after another worker has reclaimed the job.

## Provider adapter contract

Each provider is represented by `omega_provider_registry`.

The deployed `omega-provider-worker` maps a provider key to server-only environment variables:

- `OMEGA_PROVIDER_<PROVIDER_KEY>_URL`
- `OMEGA_PROVIDER_<PROVIDER_KEY>_SECRET`

and the worker authentication secret:

- `OMEGA_PROVIDER_WORKER_SECRET`

No provider secret is stored in browser code or submitted by a user.

The adapter receives:

- canonical job ID
- provider key
- capability
- request
- asset ID

The adapter should return JSON containing, for successful artifact creation:

- `job_id`
- `provider_asset_id`
- `source_uri`
- `content_sha256`
- optional `storage_path`
- optional `license`
- optional `provenance`
- optional `metadata`

A successful provider HTTP response without the required artifact identity/hash is **not sufficient to promote an asset to LIVE**. The worker and completion RPC both enforce this boundary; malformed success is converted to `FAILED / provider_artifact_unverified`.

## Asset truth promotion

An asset is promoted from `USER-CREATED / DESIGNED` to `LIVE / READY` only when the completion RPC receives:

- provider asset ID
- source URI
- content SHA-256

The completion path also records provider-job verification provenance and an E2 `omega_platform_evidence` record tied to the provider job, artifact SHA-256 and source URI.

## Current production state

The adapter runtime is deployed as:

`omega-provider-worker` version 1.

All twelve registered providers currently remain:

`UNCONFIGURED`

Therefore the system is **execution-ready but provider-not-configured**.

That is intentional. The next production action is to authenticate/configure one provider adapter and run a real end-to-end asset through:

PROJECT → ASSET → PROVIDER JOB → WORKER → PROVIDER → VERIFIED ARTIFACT → LIVE ASSET → EVENT/EVIDENCE.

Until then, no generated media is falsely presented as live.
