# Ω Knowledge Loom Embedding Worker

## Status
Implemented in production as a governed, provider-backed queue and worker.

The worker is deliberately not a fake embedding generator. The live embedding provider is currently `UNCONFIGURED`, so no vectors are produced until a real provider, model, dimension contract, endpoint and server-side credentials are configured.

## Runtime chain
`approved source → governed document → deterministic chunk → embedding job → leased worker → provider → vector proof → omega_knowledge_chunks.embedding → hybrid retrieval`

### Queue
`public.omega_knowledge_embedding_jobs` records:
- chunk/document/source/owner lineage
- provider key
- model and vector dimensions
- SHA-256 of the exact chunk text
- lifecycle state
- attempts, retry time and lease
- worker identity
- provider request/response metadata
- SHA-256 proof of the returned embedding
- error state

### Truth states
- `QUEUED`: provider contract is ready and work can run.
- `RUNNING`: a worker owns a lease.
- `SUCCEEDED`: the vector passed model, dimension, numeric-value and SHA-256 validation and was persisted.
- `BLOCKED_PROVIDER`: no usable provider configuration exists; no synthetic vector is written.
- `FAILED`: provider or artifact validation failed, subject to retry policy.
- `CANCELLED`: reserved for governed administrative cancellation.

### Provider contract
The current registry entry is `embedding_http` with capability `EMBEDDING`, status `UNCONFIGURED`, and no model or dimensions configured.

A real provider must be marked `READY` only after its server-side endpoint, credential, model and vector dimension are configured and verified.

The worker sends: `job_id, provider, model, dimensions, input_sha256, request`.

The provider must return: `embedding[], model, dimensions, embedding_sha256, provenance`.

The worker rejects success unless the vector length exactly equals the registered dimension, every value is finite numeric data, the model and dimensions exactly match the job, and the embedding SHA-256 exactly matches the canonical returned vector JSON.

## Security
- public/anonymous execution is denied for worker RPCs;
- claim/complete RPCs are service-role-only;
- private database functions are not executable by public roles;
- the Edge Function is JWT-disabled because it is a background worker endpoint and additionally requires the existing server-side worker secret;
- provider credentials are server-side only;
- no browser path receives provider secrets;
- failed or unverified provider artifacts are never promoted to vectors.

Supabase Edge Functions support server-side secrets through the function environment; production secrets must be supplied through the Supabase project secret mechanism, not committed to the repository.

## Current production truth
- embedding provider: `UNCONFIGURED`
- embedding jobs: 0
- knowledge chunks: 0
- real embeddings: 0

Therefore INTEL hybrid retrieval remains lexical until actual source chunks and verified embeddings exist.

## Next activation step
Configure a real embedding provider with a documented model and vector dimension, verify the provider response contract, then set the registry to `READY` and run the worker. Do not insert placeholder vectors to make semantic retrieval appear live.