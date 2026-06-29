// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/member-can-be-invited.specification.ts
// NEW FILE
// ============================================================================

import type {

    Membership

}

from "../entities/membership.entity.js";

import type {

    Specification

}

from "./specification.js";

export class MemberCanBeInvitedSpecification

implements Specification<Membership[]> {

    constructor(

        private readonly profileId: string

    ) {}

    async isSatisfiedBy(

        members: Membership[]

    ): Promise<boolean> {

        return !members.some(

            member =>

                member.profileId ===

                this.profileId

        );

    }

}
