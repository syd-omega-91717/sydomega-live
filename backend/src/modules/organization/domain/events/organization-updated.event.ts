// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/organization-updated.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class OrganizationUpdatedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.updated";

}
