// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/access-token.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AccessTokenId }
from "../value-objects/access-token-id";

export class AccessTokenAggregate
extends AggregateRoot<AccessTokenId>{

    issue(){}

    rotate(){}

    revoke(){}

    expire(){}

    introspect(){}

}
