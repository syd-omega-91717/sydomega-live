// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/abac.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AttributeId }
from "../value-objects/attribute-id";

export class AbacAggregate
extends AggregateRoot<AttributeId>{

    registerAttribute(){}

    validate(){}

    evaluate(){}

}
