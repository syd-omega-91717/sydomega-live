// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/privileged-command-recorded.event.ts
// NEW FILE
// ============================================================================

export class PrivilegedCommandRecordedEvent{

    constructor(

        readonly sessionId:string,

        readonly command:string

    ){}

}
