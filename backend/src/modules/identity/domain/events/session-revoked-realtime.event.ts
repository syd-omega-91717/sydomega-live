// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/session-revoked-realtime.event.ts
// NEW FILE
// ============================================================================

export class SessionRevokedRealtimeEvent{

    constructor(

        readonly sessionId:string,

        readonly reason:string

    ){}

}
