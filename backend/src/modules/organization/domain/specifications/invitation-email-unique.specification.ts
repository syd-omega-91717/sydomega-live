// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/invitation-email-unique.specification.ts
// NEW FILE
// ============================================================================

import type {

    Invitation

}

from "../entities/invitation.entity.js";

import {

    InvitationStatus

}

from "../enums/invitation-status.enum.js";

import type {

    Specification

}

from "./specification.js";

export class InvitationEmailUniqueSpecification

implements Specification<Invitation[]> {

    constructor(

        private readonly email: string

    ) {}

    async isSatisfiedBy(

        invitations: Invitation[]

    ): Promise<boolean> {

        return !invitations.some(

            invitation =>

                invitation.email

                    .toLowerCase() ===

                this.email

                    .toLowerCase()

                &&

                invitation.status ===

                InvitationStatus.PENDING

        );

    }

}
