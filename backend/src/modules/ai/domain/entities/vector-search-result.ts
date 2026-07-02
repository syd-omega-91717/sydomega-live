// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/vector-search-result.ts
// NEW FILE
// ============================================================================

export class VectorSearchResult{

    constructor(

        readonly chunkId:string,

        readonly similarity:number,

        readonly rank:number,

        readonly metadata:Record<string,unknown>

    ){}

}
