// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/session-stream-event.ts
// NEW FILE
// ============================================================================

import { SessionEventType }
from "../enums/session-event-type";

export class SessionStreamEvent{

    constructor(

        readonly id:string,

        readonly sessionId:string,

        readonly type:SessionEventType,

        readonly occurredAt:Date,

        readonly metadata:Record<string,unknown>

    ){}

}
