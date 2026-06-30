// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/behavior.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { UserId }
from "../value-objects/user-id";

export class BehaviorAggregate
extends AggregateRoot<UserId>{

    learn(){}

    detectAnomaly(){}

    updateProfile(){}

}
