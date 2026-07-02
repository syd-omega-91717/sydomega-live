// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/rag.repository.ts
// NEW FILE
// ============================================================================

import { RagAggregate }
from "../../domain/aggregates/rag.aggregate";

export interface RagRepository{

    save(

        aggregate:RagAggregate

    ):Promise<void>;

    find(

        sessionId:string

    ):Promise<RagAggregate|null>;

}
