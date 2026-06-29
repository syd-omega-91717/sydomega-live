// ============================================================================
// FILE: /backend/src/modules/organization/projections/handlers/member-joined.projector.ts
// NEW FILE
// ============================================================================

import { MemberJoinedEvent }

from "../../domain/events/member-joined.event.js";

import { OrganizationEventProjector }

from "../organization-event.projector.js";

export class MemberJoinedProjector{

    constructor(

        private readonly projector=

            new OrganizationEventProjector()

    ){}

    async handle(

        event:MemberJoinedEvent

    ){

        await this.projector.project(

            event.aggregateId

        );

    }

}
