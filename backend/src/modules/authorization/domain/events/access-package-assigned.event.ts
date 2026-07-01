// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/access-package-assigned.event.ts
// NEW FILE
// ============================================================================

export class AccessPackageAssignedEvent{

    constructor(

        readonly packageId:string,

        readonly principalId:string

    ){}

}
