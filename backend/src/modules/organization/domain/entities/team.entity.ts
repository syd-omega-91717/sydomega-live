// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/team.entity.ts
// NEW FILE
// ============================================================================

export class Team {

    constructor(

        public readonly id: string,

        public readonly organizationId: string,

        public readonly workspaceId: string | null,

        public readonly departmentId: string | null,

        public name: string,

        public description: string | null,

        public createdAt: Date,

        public updatedAt: Date

    ) {}

}
