// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/sod.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SodPolicyId }
from "../value-objects/sod-policy-id";

export class SodAggregate
extends AggregateRoot<SodPolicyId>{

    createPolicy(){}

    addRule(){}

    removeRule(){}

    enable(){}

    disable(){}

}
