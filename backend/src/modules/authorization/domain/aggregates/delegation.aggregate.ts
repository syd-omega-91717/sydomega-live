// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/delegation.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { DelegationId }
from "../value-objects/delegation-id";

export class DelegationAggregate
extends AggregateRoot<DelegationId>{

    create(){}

    activate(){}

    revoke(){}

    expire(){}

}
