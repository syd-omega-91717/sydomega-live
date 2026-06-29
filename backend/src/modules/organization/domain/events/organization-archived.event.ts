// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/organization-archived.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class OrganizationArchivedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.archived";

}
