// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/member-joined.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class MemberJoinedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.member.joined";

}
