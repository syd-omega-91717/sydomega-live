// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/identity-event.ts
// NEW FILE
// ============================================================================

import { IdentityEventCategory }
from "../enums/identity-event-category";

export class IdentityEvent{

    constructor(

        readonly id:string,

        readonly category:IdentityEventCategory,

        readonly event:string,

        readonly actorId:string,

        readonly targetId:string,

        readonly occurredAt:Date,

        readonly metadata:Record<string,unknown>

    ){}

}
