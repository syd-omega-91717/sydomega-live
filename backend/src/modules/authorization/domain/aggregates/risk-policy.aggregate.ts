// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/risk-policy.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RiskPolicyId }
from "../value-objects/risk-policy-id";

export class RiskPolicyAggregate
extends AggregateRoot<RiskPolicyId>{

    addRule(){}

    removeRule(){}

    enableRule(){}

    disableRule(){}

    evaluate(){}

}
