// ============================================================================
// FILE: /backend/src/modules/organization/domain/policies/membership.policy.ts
// NEW FILE
// ============================================================================

import { Membership }
from "../entities/membership.entity.js";

import { OwnerRemovalSpecification }
from "../specifications/owner-removal.specification.js";

export class MembershipPolicy {

    async validateOwnerRemoval(

        profileId: string,

        members: Membership[]

    ): Promise<void> {

        const allowed =

            await new OwnerRemovalSpecification(

                profileId

            ).isSatisfiedBy(

                members

            );

        if (!allowed)

            throw new Error(

                "Cannot remove the last organization owner."

            );

    }

}
