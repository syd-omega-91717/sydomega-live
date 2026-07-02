// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/framework-mapping.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { FrameworkMappingId }
from "../value-objects/framework-mapping-id";

export class FrameworkMappingAggregate
extends AggregateRoot<FrameworkMappingId>{

    createMapping(){}

    validateMapping(){}

    synchronize(){}

    publish(){}

    archive(){}

}
