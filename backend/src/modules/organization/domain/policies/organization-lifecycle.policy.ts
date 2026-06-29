// ============================================================================
// FILE: /backend/src/modules/organization/domain/policies/organization-lifecycle.policy.ts
// NEW FILE
// ============================================================================

import { OrganizationAggregate }
from "../aggregates/organization.aggregate.js";

import { OrganizationEditableSpecification }
from "../specifications/organization-editable.specification.js";

export class OrganizationLifecyclePolicy {

    async validateEditable(

        aggregate: OrganizationAggregate

    ): Promise<void> {

        const editable =

            await new OrganizationEditableSpecification()

                .isSatisfiedBy(

                    aggregate

                );

        if (!editable)

            throw new Error(

                "Organization cannot be modified."

            );

    }

}
