// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/organization-created.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class OrganizationCreatedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.created";

}
