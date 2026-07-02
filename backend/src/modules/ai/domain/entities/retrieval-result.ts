// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/retrieval-result.ts
// NEW FILE
// ============================================================================

export class RetrievalResult{

    constructor(

        readonly query:string,

        readonly chunks:DocumentChunk[],

        readonly executionTime:number,

        readonly confidence:number

    ){}

}
