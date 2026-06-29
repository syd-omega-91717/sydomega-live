// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/organization-subscription-changed.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class OrganizationSubscriptionChangedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.subscription.changed";

}
