// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/member-removed.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class MemberRemovedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.member.removed";

}
