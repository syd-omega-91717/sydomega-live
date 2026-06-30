// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/assign-role.command.ts
// NEW FILE
// ============================================================================

export class AssignRoleCommand{

    constructor(

        readonly userId:string,

        readonly roleId:string,

        readonly assignedBy:string

    ){}

}
