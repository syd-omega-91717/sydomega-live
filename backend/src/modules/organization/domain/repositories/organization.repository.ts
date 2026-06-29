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

    findBySlug(

        slug: string

    ): Promise<Organization | null>;

    exists(

        id: string

    ): Promise<boolean>;

    create(

        organization: Organization

    ): Promise<Organization>;

    update(

        organization: Organization

    ): Promise<Organization>;

    delete(

        id: string

    ): Promise<void>;

}
