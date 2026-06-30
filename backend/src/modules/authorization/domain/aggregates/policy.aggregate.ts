// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/policy.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { PolicyId }
from "../value-objects/policy-id";

export class PolicyAggregate
extends AggregateRoot<PolicyId>{

    create(){}

    update(){}

    enable(){}

    disable(){}

    evaluate(){}

}
