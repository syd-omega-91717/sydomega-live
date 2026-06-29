// ============================================================================
// FILE: /backend/src/modules/organization/domain/factories/membership.factory.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Membership } from "../entities/membership.entity.js";

import { MembershipRole } from "../enums/membership-role.enum.js";

export class MembershipFactory {

    static create(

        organizationId: string,

        profileId: string,

        role: MembershipRole

    ): Membership {

        const now = new Date();

        return new Membership(

            crypto.randomUUID(),

            organizationId,

            profileId,

            role,

            now,

            now

        );

    }

}
