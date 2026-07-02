// ============================================================================
// FILE: /backend/src/modules/ai/application/services/vector.service.ts
// NEW FILE
// ============================================================================

import { VectorSearchResult }
from "../../domain/entities/vector-search-result";

export interface VectorService{

    index(

        documentId:string

    ):Promise<void>;

    search(

        query:string,

        limit:number

    ):Promise<VectorSearchResult[]>;

}
