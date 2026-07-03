// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/events/access-approved.event.ts
// NEW FILE
// ============================================================================

export class AccessApprovedEvent{

    constructor(

        readonly sessionId:string,

        readonly subjectId:string

    ){}

}
