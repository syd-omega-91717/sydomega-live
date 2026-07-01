// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/access-request.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AccessRequestId }
from "../value-objects/access-request-id";

export class AccessRequestAggregate
extends AggregateRoot<AccessRequestId>{

    submit(){}

    approve(){}

    reject(){}

    cancel(){}

    expire(){}

}
