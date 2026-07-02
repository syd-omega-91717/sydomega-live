// ============================================================================
// FILE: /backend/src/modules/compliance/domain/events/remediation-completed.event.ts
// NEW FILE
// ============================================================================

export class RemediationCompletedEvent{

    constructor(

        readonly executionId:string,

        readonly successful:boolean

    ){}

}
