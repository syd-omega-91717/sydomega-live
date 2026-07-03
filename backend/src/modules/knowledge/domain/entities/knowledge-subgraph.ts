// ============================================================================
// FILE: /backend/src/modules/knowledge/domain/entities/knowledge-subgraph.ts
// NEW FILE
// ============================================================================

export class KnowledgeSubgraph{

    constructor(

        readonly rootEntity:string,

        readonly depth:number,

        readonly entityCount:number,

        readonly relationCount:number

    ){}

}
