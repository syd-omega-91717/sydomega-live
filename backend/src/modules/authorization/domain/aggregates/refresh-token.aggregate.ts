// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/refresh-token.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { RefreshTokenId }
from "../value-objects/refresh-token-id";

export class RefreshTokenAggregate
extends AggregateRoot<RefreshTokenId>{

    issue(){}

    rotate(){}

    revoke(){}

    detectReuse(){}

    expire(){}

}
