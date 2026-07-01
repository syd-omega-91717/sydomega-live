// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/api-key.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ApiKeyId }
from "../value-objects/api-key-id";

export class ApiKeyAggregate
extends AggregateRoot<ApiKeyId>{

    issue(){}

    rotate(){}

    suspend(){}

    revoke(){}

    recordUsage(){}

}
