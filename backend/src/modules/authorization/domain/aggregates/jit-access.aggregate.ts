// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/jit-access.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { JitAccessId }
from "../value-objects/jit-access-id";

export class JitAccessAggregate
extends AggregateRoot<JitAccessId>{

    request(){}

    approve(){}

    activate(){}

    revoke(){}

    expire(){}

}
