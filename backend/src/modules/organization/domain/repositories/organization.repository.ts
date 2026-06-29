// ============================================================================
// FILE: /backend/src/modules/organization/domain/repositories/organization.repository.ts
// NEW FILE
// ============================================================================

import { Organization }

from "../entities/organization.entity.js";

export interface OrganizationRepository {

    findById(

        id: string

    ): Promise<Organization | null>;

    create(

        organization: Organization

    ): Promise<Organization>;

    update(

        organization: Organization

    ): Promise<Organization>;

}
