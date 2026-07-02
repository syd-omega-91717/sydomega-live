// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/document-chunk.ts
// NEW FILE
// ============================================================================

export class DocumentChunk{

    constructor(

        readonly chunkId:string,

        readonly documentId:string,

        readonly embeddingId:string,

        readonly score:number,

        readonly content:string

    ){}

}
