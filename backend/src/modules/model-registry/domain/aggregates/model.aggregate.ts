// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/aggregates/model.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ModelId }
from "../value-objects/model-id";

export class ModelAggregate
extends AggregateRoot<ModelId>{

    register(){}

    approve(){}

    deploy(){}

    rollback(){}

    retire(){}

}
