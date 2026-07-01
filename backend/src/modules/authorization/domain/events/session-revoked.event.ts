// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/session-revoked.event.ts
// NEW FILE
// ============================================================================

export class SessionRevokedEvent{

    constructor(

        readonly sessionId:string

    ){}

}
