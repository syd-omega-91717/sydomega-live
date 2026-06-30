// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/identity-timeline.handler.ts
// NEW FILE
// ============================================================================

import { QueryHandler }
from "@/kernel/cqrs";

import { IdentityTimelineQuery }
from "../queries/identity-timeline.query";

export class IdentityTimelineHandler
implements QueryHandler<IdentityTimelineQuery>{

    async execute(

        query:IdentityTimelineQuery

    ){

        // Load events

        // Order timeline

        // Return projection

    }

}
