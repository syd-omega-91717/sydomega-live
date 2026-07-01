// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/privileged-session.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { PrivilegedSessionId }
from "../value-objects/privileged-session-id";

export class PrivilegedSessionAggregate
extends AggregateRoot<PrivilegedSessionId>{

    approve(){}

    start(){}

    recordCommand(){}

    suspend(){}

    terminate(){}

    expire(){}

}
