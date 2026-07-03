// ============================================================================
// FILE: /backend/src/modules/memory/domain/aggregates/memory.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { MemoryId }
from "../value-objects/memory-id";

export class MemoryAggregate
extends AggregateRoot<MemoryId>{

    store(){}

    retrieve(){}

    consolidate(){}

    forget(){}

    reconstructContext(){}

}
