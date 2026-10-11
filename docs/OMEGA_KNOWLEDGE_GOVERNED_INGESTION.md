# Ω Knowledge Loom — Governed Ingestion

This migration closes the production boundary after lexical retrieval:

SOURCE → DOCUMENT → SHA-256 IDENTITY → DETERMINISTIC CHUNKS → PROVENANCE → RETRIEVAL

The ingestion contract does not fabricate corpus content and does not treat a registered URL as proof that its content was retrieved.

## Runtime contract

`public.omega_knowledge_ingest_document(...)` is the authenticated entry point.

The privileged implementation:

1. requires authentication;
2. requires `profiles.is_owner = true`;
3. requires an existing source with `status = approved`;
4. rejects empty title/content;
5. caps content at 2,000,000 characters;
6. computes a SHA-256 document identity;
7. upserts by `(source_id, content_sha256)`;
8. chunks deterministically (default 1,800 characters; bounded 400–8,000);
9. stores per-chunk SHA-256 hashes and character offsets;
10. preserves source provenance;
11. replaces prior chunks for the same document idempotently.

## Security boundary

- No anonymous/public execute grant exists for ingestion.
- The privileged function is private and has no public/anonymous/authenticated execute grant.
- The public wrapper is security-invoker and granted only to authenticated users.
- Owner authorization is enforced inside the privileged implementation.
- The document table has RLS enabled.
- Existing retrieval remains restricted to approved sources.

## Truth boundary

The production source registry contains approved source records, but approval is not proof that content has been fetched, parsed, or indexed.

Therefore:

- source registry ≠ indexed corpus;
- chunks must originate from actual authorized content;
- no synthetic chunks are seeded;
- embeddings remain a separate phase until real chunks exist;
- semantic retrieval and generated RAG answers are not LIVE until populated and verified.

## Next verification chain

SOURCE → DOCUMENT → HASH → CHUNKS → LEXICAL RETRIEVAL → EMBEDDING → SEMANTIC RETRIEVAL → CITED ANSWER

This migration implements the first four runtime layers and preserves the existing lexical retrieval layer.
