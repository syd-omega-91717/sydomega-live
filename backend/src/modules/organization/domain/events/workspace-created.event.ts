// ============================================================================
// FILE: /backend/src/modules/organization/domain/events/workspace-created.event.ts
// NEW FILE
// ============================================================================

import { BaseDomainEvent }
from "../../../../platform/events/domain-event.js";

export class WorkspaceCreatedEvent
extends BaseDomainEvent {

    readonly name =
        "organization.workspace.created";

}
