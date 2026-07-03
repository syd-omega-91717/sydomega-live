// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/aggregates/event-bus.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EventId }
from "../value-objects/event-id";

export class EventBusAggregate
extends AggregateRoot<EventId>{

    publish(){}

    consume(){}

    replay(){}

    retry(){}

    archive(){}

}
