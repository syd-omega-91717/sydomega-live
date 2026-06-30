// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/user-unlocked.event.ts
// NEW FILE
// ============================================================================

export class UserUnlockedEvent{

    constructor(

        readonly userId:string,

        readonly administratorId:string

    ){}

}
