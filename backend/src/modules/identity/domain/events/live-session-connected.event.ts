// ============================================================================
// FILE: /backend/src/modules/identity/domain/events/live-session-connected.event.ts
// NEW FILE
// ============================================================================

export class LiveSessionConnectedEvent{

    constructor(

        readonly sessionId:string,

        readonly userId:string

    ){}

}
