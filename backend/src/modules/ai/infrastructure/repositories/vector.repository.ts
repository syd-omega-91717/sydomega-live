// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/vector.repository.ts
// NEW FILE
// ============================================================================

import { VectorAggregate }
from "../../domain/aggregates/vector.aggregate";

export interface VectorRepository{

    save(

        aggregate:VectorAggregate

    ):Promise<void>;

    find(

        embeddingId:string

    ):Promise<VectorAggregate|null>;

}
