// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/identity-event.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { IdentityEventId }
from "../value-objects/identity-event-id";

export class IdentityEventAggregate
extends AggregateRoot<IdentityEventId>{

    append(){}

    archive(){}

    publish(){}

}
