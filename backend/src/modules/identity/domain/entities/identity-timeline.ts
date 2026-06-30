// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/identity-timeline.ts
// NEW FILE
// ============================================================================

import { IdentityEvent }
from "./identity-event";

export class IdentityTimeline{

    constructor(

        readonly userId:string,

        readonly events:IdentityEvent[]

    ){}

}
