// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/conditional-access.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ConditionalAccessPolicyId }
from "../value-objects/conditional-access-policy-id";

export class ConditionalAccessAggregate
extends AggregateRoot<ConditionalAccessPolicyId>{

    create(){}

    enable(){}

    disable(){}

    evaluate(){}

    prioritize(){}

}
