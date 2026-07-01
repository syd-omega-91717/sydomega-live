// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/entitlement.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { EntitlementId }
from "../value-objects/entitlement-id";

export class EntitlementAggregate
extends AggregateRoot<EntitlementId>{

    grant(){}

    suspend(){}

    restore(){}

    revoke(){}

    expire(){}

}
