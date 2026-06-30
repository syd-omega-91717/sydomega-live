// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/user-activated.event.ts
// NEW FILE
// ============================================================================

export class UserActivatedEvent{

    constructor(

        readonly userId:string,

        readonly administratorId:string

    ){}

}
