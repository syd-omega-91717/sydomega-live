// ============================================================================
// FILE: /backend/src/modules/knowledge/application/services/knowledge-graph.service.ts
// NEW FILE
// ============================================================================

import { KnowledgeSubgraph }
from "../../domain/entities/knowledge-subgraph";

export interface KnowledgeGraphService{

    createEntity(

        label:string

    ):Promise<void>;

    connect(

        source:string,

        target:string

    ):Promise<void>;

    traverse(

        root:string,

        depth:number

    ):Promise<KnowledgeSubgraph>;

}
