// ============================================================================
// FILE: /backend/src/modules/knowledge/domain/aggregates/knowledge.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EntityId }
from "../value-objects/entity-id";

export class KnowledgeAggregate
extends AggregateRoot<EntityId>{

    createEntity(){}

    connect(){}

    traverse(){}

    infer(){}

    version(){}

}
