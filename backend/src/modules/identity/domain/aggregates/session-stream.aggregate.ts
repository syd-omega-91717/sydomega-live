// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/session-stream.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SessionStreamId }
from "../value-objects/session-stream-id";

export class SessionStreamAggregate
extends AggregateRoot<SessionStreamId>{

    connect(){}

    disconnect(){}

    broadcast(){}

    revoke(){}

    expire(){}

}
