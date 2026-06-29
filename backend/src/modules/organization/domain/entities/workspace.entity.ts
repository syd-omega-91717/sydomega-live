// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/workspace.entity.ts
// NEW FILE
// ============================================================================

export class Workspace {

    constructor(

        public readonly id: string,

        public readonly organizationId: string,

        public name: string,

        public description: string | null,

        public isDefault: boolean,

        public createdAt: Date,

        public updatedAt: Date

    ) {}

}
