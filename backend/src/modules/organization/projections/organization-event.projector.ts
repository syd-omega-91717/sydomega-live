// ============================================================================
// FILE: /backend/src/modules/organization/projections/organization-event.projector.ts
// NEW FILE
// ============================================================================

import { SupabaseOrganizationProjection }

from "./supabase-organization.projection.js";

export class OrganizationEventProjector{

    constructor(

        private readonly projection=

            new SupabaseOrganizationProjection()

    ){}

    async project(

        organizationId:string

    ){

        await this.projection.rebuildOverview(

            organizationId

        );

        await this.projection.rebuildStatistics(

            organizationId

        );

    }

}
