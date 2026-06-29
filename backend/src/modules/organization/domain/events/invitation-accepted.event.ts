// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/invitation-accepted.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class InvitationAcceptedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.invitation.accepted";

}
