// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/access-request-rejected.event.ts
// NEW FILE
// ============================================================================

export class AccessRequestRejectedEvent{

    constructor(

        readonly requestId:string,

        readonly approverId:string

    ){}

}
