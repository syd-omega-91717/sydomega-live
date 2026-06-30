// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/user-mfa-reset.event.ts
// NEW FILE
// ============================================================================

export class UserMfaResetEvent{

    constructor(

        readonly userId:string,

        readonly administratorId:string

    ){}

}
