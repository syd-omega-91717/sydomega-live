// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/access-request-approved.event.ts
// NEW FILE
// ============================================================================

export class AccessRequestApprovedEvent{

    constructor(

        readonly requestId:string,

        readonly approverId:string

    ){}

}
