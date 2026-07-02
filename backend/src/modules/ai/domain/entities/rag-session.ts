// ============================================================================
// FILE: /backend/src/modules/ai/domain/entities/rag-session.ts
// NEW FILE
// ============================================================================

import { RagSessionId }
from "../value-objects/rag-session-id";

import { RetrievalStrategy }
from "../enums/retrieval-strategy";

export class RagSession{

    constructor(

        readonly id:RagSessionId,

        readonly tenantId:string,

        readonly strategy:RetrievalStrategy,

        readonly query:string,

        readonly retrievedChunks:number,

        readonly createdAt:Date

    ){}

}
