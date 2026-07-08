// ============================================================================
// FILE:
// /enterprise/knowledge/KnowledgeOrchestrator.ts
// ============================================================================

import { DocumentIntelligenceEngine } from "./DocumentIntelligenceEngine";
import { EntityResolutionEngine } from "./EntityResolutionEngine";
import { GraphAnalyticsEngine } from "./GraphAnalyticsEngine";
import { KnowledgeGraphEngine } from "./KnowledgeGraphEngine";
import { KnowledgeRepository } from "./KnowledgeRepository";
import { OntologyEngine } from "./OntologyEngine";
import { ReasoningEngine } from "./ReasoningEngine";
import { SemanticSearchEngine } from "./SemanticSearchEngine";
import { VectorEmbeddingEngine } from "./VectorEmbeddingEngine";

export class KnowledgeOrchestrator{

    readonly ontology=

    new OntologyEngine();

    readonly graph=

    new KnowledgeGraphEngine();

    readonly semantic=

    new SemanticSearchEngine();

    readonly resolution=

    new EntityResolutionEngine();

    readonly reasoning=

    new ReasoningEngine();

    readonly analytics=

    new GraphAnalyticsEngine();

    readonly documents=

    new DocumentIntelligenceEngine();

    readonly embeddings=

    new VectorEmbeddingEngine();

    readonly repository=

    new KnowledgeRepository();

}
