// ============================================================================
// FILE: /backend/src/modules/organization/domain/specifications/owner-removal.specification.ts
// NEW FILE
// ============================================================================

import {

    MembershipRole

}

from "../enums/membership-role.enum.js";

import type {

    Membership

}

from "../entities/membership.entity.js";

import type {

    Specification

}

from "./specification.js";

export class OwnerRemovalSpecification

implements Specification<Membership[]> {

    constructor(

        private readonly ownerId: string

    ) {}

    async isSatisfiedBy(

        members: Membership[]

    ): Promise<boolean> {

        const owners =

            members.filter(

                member =>

                    member.role ===

                    MembershipRole.OWNER ||

                    member.role ===

                    MembershipRole.FOUNDER

            );

        return !(

            owners.length === 1 &&

            owners[0].profileId ===

            this.ownerId

        );

    }

}
