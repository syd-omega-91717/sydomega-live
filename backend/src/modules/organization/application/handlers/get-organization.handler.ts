// ============================================================================
// FILE: /backend/src/modules/organization/application/handlers/get-organization.handler.ts
// NEW FILE
// ============================================================================

import { GetOrganizationQuery }
from "../queries/get-organization.query.js";

import { OrganizationReadRepository }
from "../../domain/repositories/organization-read.repository.js";

export class GetOrganizationHandler {

    constructor(

        private readonly repository: OrganizationReadRepository

    ) {}

    async execute(

        query: GetOrganizationQuery

    ) {

        return this.repository.overview(

            query.organizationId

        );

    }

}
