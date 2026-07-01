// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/authorization-code.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AuthorizationCodeId }
from "../value-objects/authorization-code-id";

export class AuthorizationCodeAggregate
extends AggregateRoot<AuthorizationCodeId>{

    issue(){}

    redeem(){}

    revoke(){}

    expire(){}

    verifyPkce(){}

}
