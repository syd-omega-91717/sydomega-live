// ============================================================================
// FILE: /backend/src/modules/organization/projections/register-projections.ts
// NEW FILE
// ============================================================================

import * as Events

from "../../../services/event.service.js";

import { OrganizationCreatedProjector }

from "./handlers/organization-created.projector.js";

import { MemberJoinedProjector }

from "./handlers/member-joined.projector.js";

import { WorkspaceCreatedProjector }

from "./handlers/workspace-created.projector.js";

export function registerOrganizationProjections(){

    Events.subscribe(

        "organization.created",

        new OrganizationCreatedProjector()

    );

    Events.subscribe(

        "organization.member.joined",

        new MemberJoinedProjector()

    );

    Events.subscribe(

        "organization.workspace.created",

        new WorkspaceCreatedProjector()

    );

}
