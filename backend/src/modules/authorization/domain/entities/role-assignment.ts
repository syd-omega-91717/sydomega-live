// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/role-assignment.ts
// NEW FILE
// ============================================================================

export class RoleAssignment{

    constructor(

        readonly userId:string,

        readonly roleId:string,

        readonly assignedBy:string,

        readonly assignedAt:Date

    ){}

}
