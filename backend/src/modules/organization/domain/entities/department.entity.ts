// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/department.entity.ts
// NEW FILE
// ============================================================================

export class Department {

    constructor(

        public readonly id: string,

        public readonly organizationId: string,

        public name: string,

        public description: string | null,

        public createdAt: Date,

        public updatedAt: Date

    ) {}

}
