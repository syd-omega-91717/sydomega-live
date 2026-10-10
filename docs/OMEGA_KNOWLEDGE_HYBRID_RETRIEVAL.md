# Ω Knowledge Loom Hybrid Retrieval

## Production contract
The Knowledge Loom now exposes omega_knowledge_hybrid_search(query, embedding, limit).
- LEXICAL when no embedding is supplied.
- SEMANTIC when a valid embedding is supplied and lexical matches are absent.
- HYBRID when lexical and vector candidates overlap.
- Only approved Knowledge Loom sources participate.
- Provenance and evidence metadata are returned with every result.
- Authentication is required.
- Results are bounded to 100.
- No embeddings are fabricated.

The production database already has pgvector and the omega_knowledge_chunks.embedding column. At capability introduction, the chunk population was still empty, so semantic retrieval is a capability contract, not evidence that semantic retrieval is already populated.

## Ranking
Hybrid mode uses reciprocal-rank fusion over bounded lexical and vector candidate sets. Source quality remains a secondary ordering signal.

## Next dependency
A real embedding worker/provider must populate omega_knowledge_chunks.embedding from approved document content. The worker must record provider/model/dimension provenance and reject unverifiable artifacts. Until then, the platform must display semantic retrieval as unavailable/empty rather than fabricate results.