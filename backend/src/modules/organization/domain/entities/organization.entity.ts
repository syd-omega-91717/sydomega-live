// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/organization.entity.ts
// NEW FILE
// ============================================================================

export class Organization {

    constructor(

        public readonly id: string,

        public name: string,

        public slug: string,

        public ownerId: string,

        public status:

            | "active"
            | "suspended"
            | "archived",

        public createdAt: Date,

        public updatedAt: Date

    ) {}

}
