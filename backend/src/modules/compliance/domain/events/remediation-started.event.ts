// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/remediation-started.event.ts
// NEW FILE
// ============================================================================

export class RemediationStartedEvent{

    constructor(

        readonly executionId:string

    ){}

}
