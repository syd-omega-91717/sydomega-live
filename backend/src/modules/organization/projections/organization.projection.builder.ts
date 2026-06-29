// ============================================================================
// FILE: /backend/src/modules/organization/projections/organization.projection.builder.ts
// NEW FILE
// ============================================================================

import { OrganizationCreatedEvent }
from "../domain/events/organization-created.event.js";

import { OrganizationUpdatedEvent }
from "../domain/events/organization-updated.event.js";

import { OrganizationArchivedEvent }
from "../domain/events/organization-archived.event.js";

import { MemberJoinedEvent }
from "../domain/events/member-joined.event.js";

import { MemberRemovedEvent }
from "../domain/events/member-removed.event.js";

import { WorkspaceCreatedEvent }
from "../domain/events/workspace-created.event.js";

export interface OrganizationProjectionBuilder {

    onOrganizationCreated(
        event: OrganizationCreatedEvent
    ): Promise<void>;

    onOrganizationUpdated(
        event: OrganizationUpdatedEvent
    ): Promise<void>;

    onOrganizationArchived(
        event: OrganizationArchivedEvent
    ): Promise<void>;

    onMemberJoined(
        event: MemberJoinedEvent
    ): Promise<void>;

    onMemberRemoved(
        event: MemberRemovedEvent
    ): Promise<void>;

    onWorkspaceCreated(
        event: WorkspaceCreatedEvent
    ): Promise<void>;

}
