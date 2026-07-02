// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/vector-document.ts
// NEW FILE
// ============================================================================

import { EmbeddingModel }
from "../enums/embedding-model";

export class VectorDocument{

    constructor(

        readonly documentId:string,

        readonly tenantId:string,

        readonly embeddingModel:EmbeddingModel,

        readonly dimension:number,

        readonly chunkCount:number,

        readonly indexedAt:Date

    ){}

}
