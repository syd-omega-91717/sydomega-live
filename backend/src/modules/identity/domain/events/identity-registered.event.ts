// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/identity-registered.event.ts
// NEW FILE
// ============================================================================

import {

    BaseDomainEvent

}

from "../../../../platform/events/domain-event.js";

export class IdentityRegisteredEvent

extends BaseDomainEvent {

    readonly name =

        "identity.registered";

}
