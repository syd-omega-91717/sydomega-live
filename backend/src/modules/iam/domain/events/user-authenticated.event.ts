// ============================================================================
// FILE: /backend/src/modules/iam/domain/events/user-authenticated.event.ts
// NEW FILE
// ============================================================================

export class UserAuthenticatedEvent{

    constructor(

        readonly userId:string,

        readonly method:string

    ){}

}
