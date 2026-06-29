// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/team-created.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class TeamCreatedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.team.created";

}
