// ============================================================================
// FILE: /backend/src/modules/organization/domain/policies/subscription.policy.ts
// NEW FILE
// ============================================================================

import { OrganizationQuotaSpecification }
from "../specifications/organization-quota.specification.js";

export class SubscriptionPolicy {

    async validateMemberQuota(

        currentMembers: number,

        maximumMembers: number

    ): Promise<void> {

        const allowed =

            await new OrganizationQuotaSpecification(

                maximumMembers

            ).isSatisfiedBy(

                currentMembers

            );

        if (!allowed)

            throw new Error(

                "Organization member quota exceeded."

            );

    }

}
