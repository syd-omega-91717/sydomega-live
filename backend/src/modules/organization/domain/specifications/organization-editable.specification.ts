// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/organization-editable.specification.ts
// NEW FILE
// ============================================================================

import { OrganizationAggregate }

from "../aggregates/organization.aggregate.js";

import { OrganizationStatus }

from "../enums/organization-status.enum.js";

import type {

    Specification

}

from "./specification.js";

export class OrganizationEditableSpecification

implements Specification<OrganizationAggregate> {

    async isSatisfiedBy(

        aggregate: OrganizationAggregate

    ): Promise<boolean> {

        return (

            aggregate.organization.status !==

            OrganizationStatus.ARCHIVED

        );

    }

}
