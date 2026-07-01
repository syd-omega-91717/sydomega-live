// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/access-certified.event.ts
// NEW FILE
// ============================================================================

export class AccessCertifiedEvent{

    constructor(

        readonly certificationId:string,

        readonly userId:string,

        readonly roleId:string

    ){}

}
