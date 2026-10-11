# Ω Knowledge Loom — Production Reality

## Purpose

The Knowledge Loom is the evidence-bound runtime layer of the existing Knowledge Graph. It does not replace the graph and it does not create a second knowledge, identity, event, or evidence architecture.

It exposes only member-authorized records from canonical production sources:

1. knowledge_documents — member-authored knowledge.
2. ai_memory — persisted member-scoped AI memory.
3. graph_evidence — extracted evidence attached to the canonical graph.
4. omega_platform_evidence — governed platform evidence owned by the member.

## Truth model

- USER_CREATED — authored by the member.
- CALCULATED — stored/derived AI memory; not presented as verified fact.
- UNVERIFIED — evidence exists but human verification is absent.
- VERIFIED — evidence has a verified marker.
- LIVE — observed from the authoritative platform evidence store.

The Loom never upgrades simulation, lore, inference, or absence of evidence into LIVE fact.

## Security boundary

omega_member_knowledge_loom is a security_invoker view. Every source is filtered with auth.uid() against its member ownership column before it reaches the client.

The client receives a read-only projection. It cannot insert, verify, promote, or alter source records through the Loom.

## Retrieval contract

SOURCE → AUTHORIZATION → READ MODEL → SEARCH/FILTER → PROVENANCE → USER EXPERIENCE

The initial UI performs permission-aware lexical filtering over the canonical read model. Semantic/vector retrieval remains a separate promotion step and must satisfy the existing production convergence gate:

- approved embedding provider
- versioned vector schema
- authenticated generation
- retrieval provenance
- groundedness evaluation
- unavailable fallback

## Production promotion rule

The Knowledge Loom is a production read surface, not a claim that the platform has completed a full RAG/semantic intelligence stack.

No semantic recall claim is made until the production convergence gate is satisfied with external evidence.

## Verification

Contract coverage is provided by scripts/tests/test_omega_knowledge_loom.js.

The migration is additive and uses existing canonical tables. No duplicate identity, event, evidence, mission, capability, or WebGL system is introduced.
