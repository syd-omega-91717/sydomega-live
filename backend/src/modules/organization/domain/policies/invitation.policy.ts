// ============================================================================
// FILE: /backend/src/modules/organization/domain/policies/invitation.policy.ts
// NEW FILE
// ============================================================================

import { InvitationEmailUniqueSpecification }
from "../specifications/invitation-email-unique.specification.js";

import { MemberCanBeInvitedSpecification }
from "../specifications/member-can-be-invited.specification.js";

import { Invitation }
from "../entities/invitation.entity.js";

import { Membership }
from "../entities/membership.entity.js";

export class InvitationPolicy {

    async validate(

        email: string,

        profileId: string,

        invitations: Invitation[],

        members: Membership[]

    ): Promise<void> {

        const emailUnique =

            await new InvitationEmailUniqueSpecification(

                email

            ).isSatisfiedBy(

                invitations

            );

        if (!emailUnique)

            throw new Error(

                "An active invitation already exists."

            );

        const memberAllowed =

            await new MemberCanBeInvitedSpecification(

                profileId

            ).isSatisfiedBy(

                members

            );

        if (!memberAllowed)

            throw new Error(

                "Member already belongs to the organization."

            );

    }

}
