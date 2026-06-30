// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/user-suspended.event.ts
// NEW FILE
// ============================================================================

export class UserSuspendedEvent{

    constructor(

        readonly userId:string,

        readonly administratorId:string

    ){}

}
