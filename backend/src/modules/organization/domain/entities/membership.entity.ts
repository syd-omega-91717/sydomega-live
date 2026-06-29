// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/membership.entity.ts
// NEW FILE
// ============================================================================

import { MembershipRole } from "../enums/membership-role.enum.js";

export class Membership {

    constructor(

        public readonly id: string,

        public readonly organizationId: string,

        public readonly profileId: string,

        public role: MembershipRole,

        public joinedAt: Date,

        public updatedAt: Date

    ) {}

    changeRole(

        role: MembershipRole

    ) {

        this.role = role;

        this.updatedAt = new Date();

    }

}
