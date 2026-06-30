// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/policy-set.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { PolicySetId }
from "../value-objects/policy-set-id";

export class PolicySetAggregate
extends AggregateRoot<PolicySetId>{

    addRule(){}

    removeRule(){}

    reorderRules(){}

    evaluate(){}

}
