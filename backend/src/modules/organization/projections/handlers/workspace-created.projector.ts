// ============================================================================
// FILE: /backend/src/modules/organization/projections/handlers/workspace-created.projector.ts
// NEW FILE
// ============================================================================

import { WorkspaceCreatedEvent }

from "../../domain/events/workspace-created.event.js";

import { OrganizationEventProjector }

from "../organization-event.projector.js";

export class WorkspaceCreatedProjector{

    constructor(

        private readonly projector=

            new OrganizationEventProjector()

    ){}

    async handle(

        event:WorkspaceCreatedEvent

    ){

        await this.projector.project(

            event.aggregateId

        );

    }

}
