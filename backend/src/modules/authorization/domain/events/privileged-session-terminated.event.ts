// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/privileged-session-terminated.event.ts
// NEW FILE
// ============================================================================

export class PrivilegedSessionTerminatedEvent{

    constructor(

        readonly sessionId:string

    ){}

}
