// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/aggregates/zero-trust.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SecurityPolicyId }
from "../value-objects/security-policy-id";

export class ZeroTrustAggregate
extends AggregateRoot<SecurityPolicyId>{

    authenticate(){}

    verifyDevice(){}

    verifyWorkload(){}

    authorize(){}

    revoke(){}

}
