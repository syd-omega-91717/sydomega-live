// ============================================================================
// FILE: /backend/src/modules/audit/domain/aggregates/event-store.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EventStoreId }
from "../value-objects/event-store-id";

export class EventStoreAggregate
extends AggregateRoot<EventStoreId>{

    append(){}

    replay(){}

    snapshot(){}

    archive(){}

    verifyIntegrity(){}

}
