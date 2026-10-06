# Ω Knowledge Loom Retrieval

## Implemented chain

`SOURCE → CHUNK → INDEX → RETRIEVE → RANK → PROVENANCE`

The existing production schema already contains 11 approved knowledge sources and an empty chunk layer. This implementation makes retrieval operational without pretending the corpus is populated.

## Retrieval

Authenticated clients can call `omega_knowledge_search(query, limit)`.

The server:

1. requires an authenticated session;
2. reads only approved sources;
3. performs PostgreSQL lexical retrieval over canonical chunks;
4. ranks matches with `ts_rank_cd`;
5. uses source quality as a secondary ranking signal;
6. returns source title, publisher, canonical URL, source type/status, evidence level, chunk number and provenance;
7. caps result size at 100;
8. returns no synthetic result when the corpus is empty.

## Security

The public RPC is SECURITY INVOKER with an empty search path. The privileged implementation is private and not executable through the API role surface.

## Current reality

- Approved sources: **11**
- Indexed chunks: **0**
- Embeddings: not used by this retrieval path yet
- Semantic/vector retrieval: **not yet live**
- RAG answer generation: **not yet live**

The empty chunk count is intentional. Sources are not converted into fabricated content. The next Knowledge Loom step is governed ingestion/chunking of actual source content, followed by embedding generation and semantic retrieval.
