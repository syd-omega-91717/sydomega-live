// ============================================================================
// FILE: /backend/src/modules/ai/domain/aggregates/vector.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EmbeddingId }
from "../value-objects/embedding-id";

export class VectorAggregate
extends AggregateRoot<EmbeddingId>{

    index(){}

    search(){}

    delete(){}

    optimize(){}

    rebuild(){}

}
