// ============================================================================
// FILE: /backend/src/modules/organization/application/handlers/get-organization-statistics.handler.ts
// NEW FILE
// ============================================================================

import { GetOrganizationStatisticsQuery }
from "../queries/get-organization-statistics.query.js";

import { OrganizationReadRepository }
from "../../domain/repositories/organization-read.repository.js";

export class GetOrganizationStatisticsHandler {

    constructor(

        private readonly repository: OrganizationReadRepository

    ) {}

    async execute(

        query:GetOrganizationStatisticsQuery

    ){

        return this.repository.statistics(

            query.organizationId

        );

    }

}
