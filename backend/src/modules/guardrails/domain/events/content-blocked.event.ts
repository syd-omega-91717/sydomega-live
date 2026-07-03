// ============================================================================
// FILE: /backend/src/modules/guardrails/domain/events/content-blocked.event.ts
// NEW FILE
// ============================================================================

export class ContentBlockedEvent{

    constructor(

        readonly requestId:string,

        readonly reason:string

    ){}

}
