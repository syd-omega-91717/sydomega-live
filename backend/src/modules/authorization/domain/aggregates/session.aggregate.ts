// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/session.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SessionId }
from "../value-objects/session-id";

export class SessionAggregate
extends AggregateRoot<SessionId>{

    create(){}

    refresh(){}

    expire(){}

    revoke(){}

    logout(){}

}
