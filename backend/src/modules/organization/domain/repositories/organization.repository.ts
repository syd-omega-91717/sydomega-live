// ============================================================================
// FILE: /backend/src/modules/organization/domain/repositories/organization.repository.ts
// NEW FILE
// ============================================================================

import { OrganizationAggregate }
from "../aggregates/organization.aggregate.js";

export interface OrganizationRepository {

    findById(

        id: string

    ): Promise<OrganizationAggregate | null>;

    findBySlug(

        slug: string

    ): Promise<OrganizationAggregate | null>;

    save(

        aggregate: OrganizationAggregate

    ): Promise<void>;

    delete(

        id: string

    ): Promise<void>;

}
