// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/invitation-sent.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class InvitationSentEvent
extends BaseDomainEvent {

    readonly name =
        "organization.invitation.sent";

}
