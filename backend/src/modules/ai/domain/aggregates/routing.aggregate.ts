// ============================================================================
// FILE: /backend/src/modules/ai/domain/aggregates/routing.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RoutingId }
from "../value-objects/routing-id";

export class RoutingAggregate
extends AggregateRoot<RoutingId>{

    evaluate(){}

    score(){}

    select(){}

    reroute(){}

    finalize(){}

}
