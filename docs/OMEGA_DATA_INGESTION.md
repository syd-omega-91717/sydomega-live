# Ω Governed Data Ingestion

## Purpose
One auditable contract for importing external data without fabricating facts or creating parallel event, evidence, identity, or object systems.

## Pipeline
Provider → dataset registry → ingestion run → schema validation → normalization → freshness/expiry → provenance/hash → canonical object → event → evidence → read model → monitoring.

## Truth and failure behavior
- LIVE means a source passed approved validation and freshness policy; it is not a claim that every interpretation is objectively certain.
- CALCULATED means a reproducible derivation from identified inputs.
- SIMULATED, LORE, and USER_CREATED remain visibly distinct and are never promoted to LIVE by inference.
- Missing provenance, license, attribution, timestamps, or hashes blocks publication.
- Expired data becomes UNAVAILABLE; do not present stale values as current.
- Provider failure remains visible as UNAVAILABLE or BLOCKED; never substitute synthetic data.
- An idempotency key helps deterministic deduplication but does not prove persistence is idempotent.

## Security and operations
Provider secrets remain server-side. Every provider adapter must specify authorization, license/attribution, rate limits, retry/backoff, timeout, schema version, freshness policy, retention, deletion, monitoring, and incident behavior. User-linked data must use existing authorization and RLS boundaries.

Every published record must retain provider/dataset identity, source URI, observed/retrieved timestamps, content hash, validation outcome, and links to canonical event/evidence/lineage records.

## Production promotion gate
The JavaScript contract validates dataset/record metadata and freshness deterministically. It does not fetch providers, persist data, emit events, prove RLS, or establish production readiness.

A provider domain is production-ready only after provider approval, license review, server-side credential verification, idempotent persistence, authorization/RLS tests, event/evidence lineage, retry/dead-letter handling, negative-path tests, and authenticated production smoke evidence.

Geography/civic services, news/media, markets/economics, and science/space/environment remain UNVERIFIED until a specific provider is integrated and end-to-end evidence is recorded.
