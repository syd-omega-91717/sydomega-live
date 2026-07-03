// ============================================================================
// FILE: /backend/src/modules/iam/domain/aggregates/identity.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { IdentityId }
from "../value-objects/identity-id";

export class IdentityAggregate
extends AggregateRoot<IdentityId>{

    authenticate(){}

    enrollMFA(){}

    authorize(){}

    provision(){}

    suspend(){}

}
