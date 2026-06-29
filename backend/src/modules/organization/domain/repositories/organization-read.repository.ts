// ============================================================================
// FILE: /backend/src/modules/organization/domain/repositories/organization-read.repository.ts
// NEW FILE
// ============================================================================

import { OrganizationOverviewProjection }
from "../read-models/organization-overview.projection.js";

import { OrganizationStatisticsProjection }
from "../read-models/organization-statistics.projection.js";

export interface OrganizationReadRepository {

    overview(

        organizationId:string

    ):Promise<OrganizationOverviewProjection>;

    statistics(

        organizationId:string

    ):Promise<OrganizationStatisticsProjection>;

}
