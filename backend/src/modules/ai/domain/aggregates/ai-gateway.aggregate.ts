// ============================================================================
// FILE: /backend/src/modules/ai/domain/aggregates/ai-gateway.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AIRequestId }
from "../value-objects/ai-request-id";

export class AIGatewayAggregate
extends AggregateRoot<AIRequestId>{

    authenticate(){}

    route(){}

    stream(){}

    retry(){}

    complete(){}

}
