// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/role-assigned.event.ts
// NEW FILE
// ============================================================================

export class RoleAssignedEvent{

    constructor(

        readonly userId:string,

        readonly roleId:string

    ){}

}
