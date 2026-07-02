// ============================================================================
// FILE: /backend/src/modules/ai/application/services/rag.service.ts
// NEW FILE
// ============================================================================

import { RetrievalResult }
from "../../domain/entities/retrieval-result";

export interface RagService{

    retrieve(

        query:string,

        tenantId:string

    ):Promise<RetrievalResult>;

    buildContext(

        sessionId:string

    ):Promise<string>;

}
