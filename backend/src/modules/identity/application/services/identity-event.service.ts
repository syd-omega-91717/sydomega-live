// ============================================================================
// FILE: /backend/src/modules/identity/application/services/identity-event.service.ts
// NEW FILE
// ============================================================================

import { IdentityEvent }
from "../../domain/entities/identity-event";

export interface IdentityEventService{

    publish(

        event:IdentityEvent

    ):Promise<void>;

    timeline(

        userId:string

    ):Promise<IdentityEvent[]>;

}
