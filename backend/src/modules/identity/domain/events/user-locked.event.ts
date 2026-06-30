// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/user-locked.event.ts
// NEW FILE
// ============================================================================

export class UserLockedEvent{

    constructor(

        readonly userId:string,

        readonly administratorId:string

    ){}

}
