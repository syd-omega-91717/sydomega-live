// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/organization-quota.specification.ts
// NEW FILE
// ============================================================================

import type {

    Specification

}

from "./specification.js";

export class OrganizationQuotaSpecification

implements Specification<number> {

    constructor(

        private readonly maximum: number

    ) {}

    async isSatisfiedBy(

        current: number

    ): Promise<boolean> {

        return current < this.maximum;

    }

}
