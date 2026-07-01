// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/mfa-policy.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { MfaPolicyId }
from "../value-objects/mfa-policy-id";

export class MfaPolicyAggregate
extends AggregateRoot<MfaPolicyId>{

    create(){}

    enable(){}

    disable(){}

    requireChallenge(){}

    verify(){}

}
