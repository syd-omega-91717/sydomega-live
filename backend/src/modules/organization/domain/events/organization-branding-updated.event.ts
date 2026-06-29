// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/organization-branding-updated.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class OrganizationBrandingUpdatedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.branding.updated";

}
