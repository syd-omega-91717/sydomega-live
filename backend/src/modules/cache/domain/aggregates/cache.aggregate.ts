// ============================================================================
// FILE: /backend/src/modules/cache/domain/aggregates/cache.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { CacheKey }
from "../value-objects/cache-key";

export class CacheAggregate
extends AggregateRoot<CacheKey>{

    put(){}

    get(){}

    invalidate(){}

    lock(){}

    unlock(){}

}
