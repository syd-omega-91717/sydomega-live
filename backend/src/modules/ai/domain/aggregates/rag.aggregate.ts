// ============================================================================
// FILE: /backend/src/modules/ai/domain/aggregates/rag.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RagSessionId }
from "../value-objects/rag-session-id";

export class RagAggregate
extends AggregateRoot<RagSessionId>{

    retrieve(){}

    rerank(){}

    compress(){}

    buildContext(){}

    answer(){}

}
