// ============================================================================
// FILE: /backend/src/modules/iam/domain/events/access-granted.event.ts
// NEW FILE
// ============================================================================

export class AccessGrantedEvent{

    constructor(

        readonly userId:string,

        readonly resource:string

    ){}

}
