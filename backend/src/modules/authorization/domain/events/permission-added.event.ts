// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/permission-added.event.ts
// NEW FILE
// ============================================================================

export class PermissionAddedEvent{

    constructor(

        readonly roleId:string,

        readonly permissionId:string

    ){}

}
