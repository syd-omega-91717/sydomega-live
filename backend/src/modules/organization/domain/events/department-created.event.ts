// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/department-created.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class DepartmentCreatedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.department.created";

}
