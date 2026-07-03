// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/events/access-denied.event.ts
// NEW FILE
// ============================================================================

export class AccessDeniedEvent{

    constructor(

        readonly sessionId:string,

        readonly reason:string

    ){}

}
