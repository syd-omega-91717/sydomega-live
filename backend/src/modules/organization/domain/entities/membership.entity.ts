// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/membership.entity.ts
// NEW FILE
// ============================================================================

export class Membership {

    constructor(

        public readonly id: string,

        public readonly organizationId: string,

        public readonly profileId: string,

        public role: string,

        public joinedAt: Date

    ) {}

}
