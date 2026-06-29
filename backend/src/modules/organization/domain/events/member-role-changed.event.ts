// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/member-role-changed.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class MemberRoleChangedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.member.role.changed";

}
