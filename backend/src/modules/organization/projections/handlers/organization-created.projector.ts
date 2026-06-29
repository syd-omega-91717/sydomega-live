// ============================================================================
// FILE: /backend/src/modules/organization/projections/handlers/organization-created.projector.ts
// NEW FILE
// ============================================================================

import { OrganizationCreatedEvent }

from "../../domain/events/organization-created.event.js";

import { OrganizationEventProjector }

from "../organization-event.projector.js";

export class OrganizationCreatedProjector{

    constructor(

        private readonly projector=

            new OrganizationEventProjector()

    ){}

    async handle(

        event:OrganizationCreatedEvent

    ){

        await this.projector.project(

            event.aggregateId

        );

    }

}
